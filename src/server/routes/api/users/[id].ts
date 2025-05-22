import { bytes } from '@/lib/bytes';
import { hashPassword } from '@/lib/crypto';
import { datasource } from '@/lib/datasource';
import { prisma } from '@/lib/db';
import { User, userSelect } from '@/lib/db/models/user';
import { log } from '@/lib/logger';
import { canInteract } from '@/lib/role';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import { UserFilesQuota } from '../../../../../generated/client';
import fastifyPlugin from 'fastify-plugin';
import { z } from 'zod';

export type ApiUsersIdResponse = User;

type Body = {
  username?: string;
  password?: string;
  avatar?: string;
  role?: 'USER' | 'ADMIN' | 'SUPERADMIN';
  quota?: {
    filesType?: UserFilesQuota & 'NONE';
    maxFiles?: number;
    maxBytes?: string;

    maxUrls?: number;
  };

  delete?: boolean;
};

type Params = {
  id: string;
};

const logger = log('api').c('users').c('[id]');
const zNumber = z.number();

export const PATH = '/api/users/:id';
export default fastifyPlugin(
  (server, _, done) => {
    server.get<{ Params: Params }>(
      PATH,
      { preHandler: [userMiddleware, administratorMiddleware] },
      async (req, res) => {
        const user = await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },
          select: userSelect,
        });

        if (!user) return res.notFound('User not found');

        return res.send(user);
      },
    );

    server.patch<{ Params: Params; Body: Body }>(
      PATH,
      { preHandler: [userMiddleware, administratorMiddleware] },
      async (req, res) => {
        const user = await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },
          select: userSelect,
        });

        if (!user) return res.notFound('User not found');

        const { username, password, avatar, role, quota } = req.body;

        if (role && !z.enum(['USER', 'ADMIN']).safeParse(role).success)
          return res.badRequest('Invalid role (USER, ADMIN)');

        if (role && !canInteract(req.user.role, role)) return res.forbidden('You cannot assign this role');

        let finalQuota:
          | {
              filesQuota?: UserFilesQuota;
              maxFiles?: number | null;
              maxBytes?: string | null;
              maxUrls?: number | null;
            }
          | undefined = undefined;
        if (quota) {
          if (quota.filesType && !z.enum(['BY_BYTES', 'BY_FILES', 'NONE']).safeParse(quota.filesType).success)
            return res.badRequest('Invalid filesType (BY_BYTES, BY_FILES, NONE)');

          if (quota.maxFiles && !zNumber.safeParse(quota.maxFiles).success)
            return res.badRequest('Invalid maxFiles');
          if (quota.maxUrls && !zNumber.safeParse(quota.maxUrls).success)
            return res.badRequest('Invalid maxUrls');

          if (quota.filesType === 'BY_BYTES' && quota.maxBytes === undefined)
            return res.badRequest('maxBytes is required');
          if (quota.filesType === 'BY_FILES' && quota.maxFiles === undefined)
            return res.badRequest('maxFiles is required');

          finalQuota = {
            ...(quota.filesType === 'BY_BYTES' && {
              filesQuota: 'BY_BYTES',
              maxBytes: bytes(quota.maxBytes || '0') > 0 ? quota.maxBytes : null,
              maxFiles: null,
            }),
            ...(quota.filesType === 'BY_FILES' && {
              filesQuota: 'BY_FILES',
              maxFiles: quota.maxFiles,
              maxBytes: null,
            }),
            ...(quota.filesType === 'NONE' && {
              filesQuota: 'BY_BYTES',
              maxFiles: null,
              maxBytes: null,
            }),
            maxUrls: (quota.maxUrls || 0) > 0 ? quota.maxUrls : null,
          };
        }

        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            ...(username && { username }),
            ...(password && { password: await hashPassword(password) }),
            ...(role !== undefined && { role: role || 'USER' }),
            ...(avatar && { avatar }),
            ...(finalQuota && {
              quota: {
                upsert: {
                  where: {
                    userId: user.id,
                  },
                  create: {
                    filesQuota: finalQuota.filesQuota || 'BY_BYTES',
                    maxFiles: finalQuota.maxFiles ?? null,
                    maxBytes: finalQuota.maxBytes ?? null,
                    maxUrls: finalQuota.maxUrls ?? null,
                  },
                  update: finalQuota,
                },
              },
            }),
          },
          select: {
            ...userSelect,
            totpSecret: false,
            passkeys: false,
          },
        });

        logger.info(`${req.user.username} updated another user`, {
          username: updatedUser.username,
          updated: Object.keys(req.body),
        });

        return res.send(updatedUser);
      },
    );

    server.delete<{ Params: Params; Body: Body }>(
      PATH,
      { preHandler: [userMiddleware, administratorMiddleware] },
      async (req, res) => {
        const user = await prisma.user.findUnique({
          where: {
            id: req.params.id,
          },
          select: userSelect,
        });

        if (!user) return res.notFound('User not found');
        if (user.id === req.user.id) return res.forbidden('You cannot delete yourself');
        if (!canInteract(req.user.role, user.role)) return res.forbidden('You cannot delete this user');

        if (req.body.delete) {
          const files = await prisma.file.findMany({
            where: {
              userId: user.id,
            },
            select: {
              name: true,
            },
          });

          const [{ count: filesDeleted }, { count: urlsDeleted }] = await prisma.$transaction([
            prisma.file.deleteMany({
              where: {
                userId: user.id,
              },
            }),
            prisma.url.deleteMany({
              where: {
                userId: user.id,
              },
            }),
          ]);

          logger.debug(`preparing to delete ${files.length} files from datasource`, {
            username: user.username,
          });

          for (let i = 0; i !== files.length; ++i) {
            await datasource.delete(files[i].name);
          }

          logger.info(`${req.user.username} deleted another user's files & urls`, {
            username: user.username,
            deletedFiles: filesDeleted,
            deletedUrls: urlsDeleted,
          });
        }

        await prisma.oAuthProvider.deleteMany({
          where: {
            userId: user.id,
          },
        });

        const deletedUser = await prisma.user.delete({
          where: {
            id: user.id,
          },
          select: {
            ...userSelect,
            totpSecret: false,
          },
        });

        logger.info(`${req.user.username} deleted another user`, {
          username: deletedUser.username,
          role: deletedUser.role,
        });

        return res.send(deletedUser);
      },
    );

    done();
  },
  { name: PATH },
);
