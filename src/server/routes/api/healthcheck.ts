import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import fastifyPlugin from 'fastify-plugin';
import { parse } from 'url';

export type ApiHealthcheckResponse = {
  pass: boolean;
};

const logger = log('api').c('healthcheck');

export const PATH = '/api/healthcheck';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, async (req, res) => {
      const parsedUrl = parse(req.url!, true);
      if (!config.features.healthcheck) return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);

      try {
        await prisma.$queryRaw`SELECT 1;`;
        return res.send({ pass: true });
      } catch (e) {
        logger.error('there was an error during a healthcheck').error(e as Error);
        return res.internalServerError('there was an error during a healthcheck');
      }
    });

    done();
  },
  { name: PATH },
);
