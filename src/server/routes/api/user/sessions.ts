import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import { userMiddleware } from '@/server/middleware/user';
import { getSession } from '@/server/session';
import fastifyPlugin from 'fastify-plugin';

export type ApiUserSessionsResponse = {
  current: string;
  other: string[];
};

type Body = {
  sessionId?: string;
  all?: boolean;
};

const logger = log('api').c('user').c('sessions');

export const PATH = '/api/user/sessions';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, { preHandler: [userMiddleware] }, async (req, res) => {
      const currentSession = await getSession(req, res);

      return res.send({
        current: currentSession.sessionId,
        other: req.user.sessions.filter((session) => session !== currentSession.sessionId),
      });
    });

    server.delete<{ Body: Body }>(PATH, { preHandler: [userMiddleware] }, async (req, res) => {
      const currentSession = await getSession(req, res);

      if (req.body.all) {
        await prisma.user.update({
          where: {
            id: req.user.id,
          },
          data: {
            sessions: {
              set: [currentSession.sessionId!],
            },
          },
        });

        logger.info('user logged out all logged in sessions', {
          user: req.user.username,
        });

        return res.send({
          current: currentSession.sessionId,
          other: [],
        });
      }

      if (!req.body.sessionId) return res.badRequest('No session provided');
      if (req.body.sessionId === currentSession.sessionId)
        return res.badRequest('Cannot delete current session');
      if (!req.user.sessions.includes(req.body.sessionId))
        return res.badRequest('Session not found in logged in sessions');

      const sessionsWithout = req.user.sessions.filter((session) => session !== req.body.sessionId);

      await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          sessions: {
            set: sessionsWithout,
          },
        },
      });

      logger.info('user logged out of session', {
        user: req.user.username,
        session: req.body.sessionId,
      });

      return res.send({
        current: currentSession.sessionId,
        other: sessionsWithout,
      });
    });

    done();
  },
  { name: PATH },
);
