import { prisma } from '@/lib/db';
import { IncompleteFile } from '@/lib/db/models/incompleteFile';
import { log } from '@/lib/logger';
import { userMiddleware } from '@/server/middleware/user';
import fastifyPlugin from 'fastify-plugin';

export type ApiUserFilesIncompleteResponse = IncompleteFile[] | { count: number };

type Body = {
  id: string[];
};

const logger = log('api').c('user').c('files').c('incomplete');

export const PATH = '/api/user/files/incomplete';
export default fastifyPlugin(
  (server, _, done) => {
    server.route<{
      Body: Body;
    }>({
      url: PATH,
      method: ['GET', 'DELETE'],
      preHandler: [userMiddleware],
      handler: async (req, res) => {
        if (req.method === 'DELETE') {
          if (!req.body.id) return res.badRequest('no id array provided');

          const existingFiles = await prisma.incompleteFile.findMany({
            where: {
              id: {
                in: req.body.id,
              },
              userId: req.user.id,
            },
          });

          const incompleteFiles = await prisma.incompleteFile.deleteMany({
            where: {
              id: {
                in: existingFiles.map((x) => x.id),
              },
            },
          });

          logger.info('incomplete files deleted', {
            count: incompleteFiles.count,
            user: req.user.username,
          });

          return res.send(incompleteFiles);
        }

        const incompleteFiles = await prisma.incompleteFile.findMany({
          where: {
            userId: req.user.id,
          },
        });

        return res.send(incompleteFiles);
      },
    });

    done();
  },
  { name: PATH },
);
