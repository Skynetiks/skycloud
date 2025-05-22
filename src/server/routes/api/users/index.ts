import { config } from '@/lib/config';
import { createToken, hashPassword } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { User, userSelect } from '@/lib/db/models/user';
import { log } from '@/lib/logger';
import { canInteract } from '@/lib/role';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import { Role } from '../../../../../generated/client';
import fastifyPlugin from 'fastify-plugin';
import { readFile } from 'fs/promises';
import { z } from 'zod';

export type ApiUsersResponse = User[] | User;

type Query = {
  noincl?: 'true' | 'false';
};

type Body = {
  username?: string;
  password?: string;
  avatar?: string;
  role?: Role;
};

const logger = log('api').c('users');

export const PATH = '/api/users';
export default fastifyPlugin(
  (server, _, done) => {
    server.get<{ Querystring: Query }>(
      PATH,
      { preHandler: [userMiddleware, administratorMiddleware] },
      async (req, res) => {
        const users = await prisma.user.findMany({
          select: {
            ...userSelect,
            avatar: true,
          },
          where: {
            ...(req.query.noincl === 'true' && { id: { not: req.user.id } }),
          },
        });

        return res.send(users);
      },
    );

    server.post<{ Querystring: Query; Body: Body }>(
      PATH,
      { preHandler: [userMiddleware, administratorMiddleware] },
      async (req, res) => {
        const { username, password, avatar, role } = req.body;

        if (!username) return res.badRequest('Username is required');
        if (!password) return res.badRequest('Password is required');

        let avatar64 = null;

        try {
          if (config.website.defaultAvatar) {
            avatar64 = (await readFile(config.website.defaultAvatar)).toString('base64');
          } else if (avatar) {
            avatar64 = avatar;
          }
        } catch {
          logger.debug('failed to read default avatar', { path: config.website.defaultAvatar });
        }

        if (role && !z.enum(['USER', 'ADMIN']).safeParse(role).success)
          return res.badRequest('Invalid role (USER, ADMIN)');

        if (role && !canInteract(req.user.role, role)) return res.forbidden('You cannot create this role');

        const user = await prisma.user.create({
          data: {
            username,
            password: await hashPassword(password),
            role: role ?? 'USER',
            avatar: avatar64 ?? null,
            token: createToken(),
          },
          select: {
            ...userSelect,
            totpSecret: false,
            passkeys: false,
          },
        });

        logger.info(`${req.user.username} created a new user`, {
          username: user.username,
          role: user.role,
        });

        return res.send(user);
      },
    );

    done();
  },
  { name: PATH },
);
