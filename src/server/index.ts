import { bytes } from '@/lib/bytes';
import { reloadSettings } from '@/lib/config';
import { getDatasource } from '@/lib/datasource';
import { prisma } from '@/lib/db';
import { runMigrations } from '@/lib/db/migration';
import { log } from '@/lib/logger';
import { notNull } from '@/lib/primitive';
import { isAdministrator } from '@/lib/role';
import { Tasks } from '@/lib/tasks';
import clearInvites from '@/lib/tasks/run/clearInvites';
import deleteFiles from '@/lib/tasks/run/deleteFiles';
import maxViews from '@/lib/tasks/run/maxViews';
import metrics from '@/lib/tasks/run/metrics';
import thumbnails from '@/lib/tasks/run/thumbnails';
import { fastifyCookie } from '@fastify/cookie';
import { fastifyCors } from '@fastify/cors';
import { fastifyMultipart } from '@fastify/multipart';
import { fastifyRateLimit } from '@fastify/rate-limit';
import { fastifySensible } from '@fastify/sensible';
import { fastifyStatic } from '@fastify/static';
import fastify from 'fastify';
import { mkdir, readFile } from 'fs/promises';
import ms, { StringValue } from 'ms';
import { parse } from 'url';
import { version } from '../../package.json';
import { checkRateLimit } from './plugins/checkRateLimit';
import next, { ALL_METHODS } from './plugins/next';
import loadRoutes from './routes';
import { filesRoute } from './routes/files.dy';
import { urlsRoute } from './routes/urls.dy';
import oauthPlugin from './plugins/oauth';

const MODE = process.env.NODE_ENV || 'production';
const logger = log('server');

declare global {
  interface BigInt {
    toJSON(): number;
  }
}

BigInt.prototype.toJSON = function () {
  return Number(this.toString());
};

async function main() {
  const argv = process.argv.slice(2);
  logger.info('starting skycloud', { mode: MODE, version: version, argv });

  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL not set, exiting...');
    process.exit(1);
  }

  await runMigrations();

  logger.info('reading settings...');
  await reloadSettings();

  const config = global.__config__;
  getDatasource(config);

  if (config.datasource.type === 'local') {
    await mkdir(config.datasource.local!.directory, { recursive: true });
  }

  await mkdir(config.core.tempDirectory, { recursive: true });

  const server = fastify({
    ignoreTrailingSlash: true,
    https: notNull(config.ssl.key, config.ssl.cert)
      ? {
          key: await readFile(config.ssl.key!, 'utf8'),
          cert: await readFile(config.ssl.cert!, 'utf8'),
        }
      : null,
  });

  await server.register(fastifyCookie, {
    secret: config.core.secret,
    hook: 'onRequest',
  });

  await server.register(fastifyCors);

  await server.register(fastifySensible);

  await server.register(fastifyMultipart, {
    limits: {
      fileSize: bytes(config.files.maxFileSize),
    },
  });

  await server.register(fastifyStatic, {
    serve: false,
    root: config.core.tempDirectory,
  });

  await server.register(oauthPlugin);

  if (config.ratelimit.enabled) {
    try {
      checkRateLimit(config);

      await server.register(fastifyRateLimit, {
        global: false,
        hook: 'preHandler',
        max: config.ratelimit.max,
        timeWindow: config.ratelimit.window ?? undefined,
        keyGenerator: (req) => {
          return req.user?.id;
        },
        allowList: async (req, key) => {
          if (config.ratelimit.adminBypass && isAdministrator(req.user?.role)) return true;
          if (config.ratelimit.allowList.includes(key)) return true;
          if (Object.keys(req.headers).includes('x-skycloud-p-filename')) return true;

          return false;
        },
      });
    } catch (e) {
      if (process.env.DEBUG) console.error(e);

      logger
        .c('ratelimit')
        .error((<Error>e).message)
        .error('skipping ratelimit setup due to error above');
    }
  }

  if (config.files.route === '/' && config.urls.route === '/') {
    logger.debug('files & urls route = /, using catch-all route');

    server.get<{ Params: { id: string } }>('/:id', async (req, res) => {
      const { id } = req.params;
      const parsedUrl = parse(req.url!, true);

      if (id === '') return server.nextServer.render404(req.raw, res.raw, parsedUrl);
      else if (id === 'dashboard') return server.nextServer.render(req.raw, res.raw, '/dashboard');

      const url = await prisma.url.findFirst({
        where: {
          OR: [{ code: id }, { vanity: id }],
        },
      });

      if (url) return urlsRoute(req as any, res);
      else return filesRoute(req as any, res);
    });
  } else {
    server.get(config.files.route === '/' ? '/:id' : `${config.files.route}/:id`, filesRoute);
    server.get(config.urls.route === '/' ? '/:id' : `${config.urls.route}/:id`, urlsRoute);
  }

  if (!argv.includes('--skip-next'))
    await server.register(next, {
      dev: MODE === 'development',
      quiet: MODE === 'production',
      hostname: config.core.hostname,
      port: config.core.port,
      dir: '.',
    });

  const routes = await loadRoutes();
  const routesOptions = Object.values(routes);
  Promise.all(routesOptions.map((route) => server.register(route)));

  if (!argv.includes('--skip-next')) {
    server.get('/', (_, res) => res.redirect('/dashboard'));
    server.next('/*', ALL_METHODS);
    server.next('/dashboard', ALL_METHODS);
    server.next('/reload', ALL_METHODS);
  }

  // // TODO: no longer need this when all the api routes are handled by fastify :)
  // const routeKeys = Object.keys(routes); // holds "currently migrated routes" so we can parse json through fastify
  // server.addContentTypeParser('application/json', (req, body, done) => {
  //   if (routeKeys.includes(req.routeOptions.config.url)) {
  //     let bodyString = '';
  //     body.on('data', (chunk) => {
  //       bodyString += chunk;
  //     });

  //     body.on('end', () => {
  //       if (bodyString === '' || bodyString === null) return done(null, {});

  //       server.getDefaultJsonParser('error', 'ignore')(req, bodyString, done);
  //     });
  //   } else done(null, body);
  // });

  server.setErrorHandler((error, _, res) => {
    if (error.statusCode) {
      res.status(error.statusCode);
      res.send({ error: error.message, statusCode: error.statusCode });
    } else {
      if (process.env.DEBUG === 'skycloud') console.error(error);

      res.status(500);
      res.send({ error: 'Internal Server Error', statusCode: 500, message: error.message });
    }
  });

  const tasks = new Tasks();
  server.decorate('tasks', tasks);

  await server.listen({
    port: config.core.port,
    host: config.core.hostname,
  });

  logger.info('server started', { hostname: config.core.hostname, port: config.core.port });

  // Tasks
  tasks.interval('deletefiles', ms(config.tasks.deleteInterval as StringValue), deleteFiles(prisma));
  tasks.interval('maxviews', ms(config.tasks.maxViewsInterval as StringValue), maxViews(prisma));

  if (config.features.metrics)
    tasks.interval('metrics', ms(config.tasks.metricsInterval as StringValue), metrics(prisma));

  if (config.features.thumbnails.enabled) {
    for (let i = 0; i !== config.features.thumbnails.num_threads; ++i) {
      tasks.worker(`thumbnail-${i}`, './build/offload/thumbnails.js', {
        id: `thumbnail-${i}`,
        enabled: config.features.thumbnails.enabled,
      });
    }

    tasks.interval('thumbnails', ms(config.tasks.thumbnailsInterval as StringValue), thumbnails(prisma));
    tasks.interval(
      'clearinvites',
      ms(config.tasks.clearInvitesInterval as StringValue),
      clearInvites(prisma),
    );
  }

  tasks.start();
}

main();

declare module 'fastify' {
  interface FastifyInstance {
    tasks: Tasks;
  }
}
