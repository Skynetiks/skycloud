import { config } from '@/lib/config';
import fastifyPlugin from 'fastify-plugin';
import { parse } from 'url';

export const PATH = '/robots.txt';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, async (req, res) => {
      const parsedUrl = parse(req.url!, true);

      if (!config.features.robotsTxt) return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);

      return 'User-Agent: *\nDisallow: /';
    });

    done();
  },
  { name: PATH },
);
