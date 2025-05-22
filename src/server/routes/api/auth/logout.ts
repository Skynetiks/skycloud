import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import { userMiddleware } from '@/server/middleware/user';
import { getSession } from '@/server/session';
import fastifyPlugin from 'fastify-plugin';

export type ApiLogoutResponse = {
  loggedOut?: boolean;
};

const logger = log('api').c('auth').c('logout');

export const PATH = '/api/auth/logout';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, { preHandler: [userMiddleware] }, async (req, res) => {
      const current = await getSession(req, res);

      await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          sessions: {
            set: req.user.sessions.filter((session) => session !== current.sessionId),
          },
        },
      });

      current.destroy();

      logger.info('user logged out', {
        user: req.user.username,
        ip: req.ip ?? 'unknown',
        ua: req.headers['user-agent'],
      });

      return res.send({ loggedOut: true });
    });

    done();
  },
  { name: PATH },
);
