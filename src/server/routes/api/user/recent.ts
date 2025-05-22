import { prisma } from '@/lib/db';
import { File, cleanFiles, fileSelect } from '@/lib/db/models/file';
import { userMiddleware } from '@/server/middleware/user';
import fastifyPlugin from 'fastify-plugin';

export type ApiUserRecentResponse = File[];

type Query = {
  take?: string;
};

export const PATH = '/api/user/recent';
export default fastifyPlugin(
  (server, _, done) => {
    server.get<{ Querystring: Query }>(PATH, { preHandler: [userMiddleware] }, async (req, res) => {
      const { take: rawTake } = req.query;
      const take = rawTake ? parseInt(rawTake, 10) : undefined;

      const files = cleanFiles(
        await prisma.file.findMany({
          where: {
            userId: req.user.id,
          },
          select: {
            ...fileSelect,
            password: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: take ?? 3,
        }),
      );

      return res.send(files);
    });

    done();
  },
  { name: PATH },
);
