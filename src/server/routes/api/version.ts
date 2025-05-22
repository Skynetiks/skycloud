import { config } from '@/lib/config';
import { log } from '@/lib/logger';
import { getVersion } from '@/lib/version';
import { userMiddleware } from '@/server/middleware/user';
import fastifyPlugin from 'fastify-plugin';

export type ApiVersionResponse = {
  details: ReturnType<typeof getVersion>;
  data: VersionAPI;
};

interface VersionAPI {
  isUpstream: boolean;
  isRelease: boolean;
  isLatest: boolean;
  version: {
    tag: string;
    sha: string;
    url: string;
  };
  latest: {
    tag: string;
    url: string;
    commit?: {
      sha: string;
      url: string;
      pull: boolean;
    };
  };
}

const logger = log('api').c('version');

export const PATH = '/api/version';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, { preHandler: [userMiddleware] }, async (_, res) => {
      if (!config.features.versionChecking) return res.notFound();

      const details = getVersion();

      const url = new URL(config.features.versionAPI);
      url.pathname = '/';
      url.searchParams.set('details', JSON.stringify(details));

      try {
        const resp = await fetch(url);

        if (!resp.ok) {
          return res.internalServerError('failed to fetch version details: ' + (await resp.text()));
        }

        const data: VersionAPI = await resp.json();

        return res.send({
          data,
          details,
        });
      } catch (e) {
        logger.error('failed to fetch version details').error(e as Error);
        return res.internalServerError('failed to fetch version details: ' + (e as Error).message);
      }
    });

    done();
  },
  { name: PATH },
);
