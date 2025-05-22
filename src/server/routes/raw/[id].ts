import { parseRange } from '@/lib/api/range';
import { config } from '@/lib/config';
import { verifyPassword } from '@/lib/crypto';
import { datasource } from '@/lib/datasource';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import fastifyPlugin from 'fastify-plugin';
import { parse } from 'url';

type Params = {
  id: string;
};

type Querystring = {
  pw?: string;
  download?: string;
};

const logger = log('routes').c('raw');

export const PATH = '/raw/:id';
export default fastifyPlugin(
  (server, _, done) => {
    server.get<{
      Querystring: Querystring;
      Params: Params;
    }>(PATH, async (req, res) => {
      const { id } = req.params;
      const { pw, download } = req.query;

      const parsedUrl = parse(req.url!, true);

      const file = await prisma.file.findFirst({
        where: {
          name: decodeURIComponent(id),
        },
      });

      if (file?.deletesAt && file.deletesAt <= new Date()) {
        try {
          await datasource.delete(file.name);
          await prisma.file.delete({
            where: {
              id: file.id,
            },
          });
        } catch (e) {
          logger
            .error('failed to delete file on expiration', {
              id: file.id,
            })
            .error(e as Error);
        }

        return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);
      }

      if (file?.maxViews && file.views >= file.maxViews) {
        if (!config.features.deleteOnMaxViews)
          return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);

        try {
          await datasource.delete(file.name);
          await prisma.file.delete({
            where: {
              id: file.id,
            },
          });
        } catch (e) {
          logger
            .error('failed to delete file on max views', {
              id: file.id,
            })
            .error(e as Error);
        }

        return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);
      }

      if (file?.password) {
        if (!pw) return res.forbidden('Password protected.');
        const verified = await verifyPassword(pw, file.password!);

        if (!verified) return res.forbidden('Incorrect password.');
      }

      const size = file?.size || (await datasource.size(file?.name ?? id));

      if (req.headers.range) {
        const [start, end] = parseRange(req.headers.range, size);
        if (start >= size || end >= size) {
          const buf = await datasource.get(file?.name ?? id);
          if (!buf) return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);

          return res
            .type(file?.type || 'application/octet-stream')
            .headers({
              'Content-Length': size,
              ...(file?.originalName
                ? {
                    'Content-Disposition': `${download ? 'attachment; ' : ''}filename="${encodeURIComponent(file.originalName)}"`,
                  }
                : download && {
                    'Content-Disposition': 'attachment;',
                  }),
            })
            .status(416)
            .send(buf);
        }

        const buf = await datasource.range(file?.name ?? id, start || 0, end);
        if (!buf) return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);

        return res
          .type(file?.type || 'application/octet-stream')
          .headers({
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            ...(file?.originalName
              ? {
                  'Content-Disposition': `${download ? 'attachment; ' : ''}filename="${encodeURIComponent(file.originalName)}"`,
                }
              : download && {
                  'Content-Disposition': 'attachment;',
                }),
          })
          .status(206)
          .send(buf);
      }

      const buf = await datasource.get(file?.name ?? id);
      if (!buf) return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);

      return res
        .type(file?.type || 'application/octet-stream')
        .headers({
          'Content-Length': size,
          'Accept-Ranges': 'bytes',
          ...(file?.originalName
            ? {
                'Content-Disposition': `${download ? 'attachment; ' : ''}filename="${encodeURIComponent(file.originalName)}"`,
              }
            : download && {
                'Content-Disposition': 'attachment;',
              }),
        })
        .status(200)
        .send(buf);
    });

    done();
  },
  { name: PATH },
);
