import fastifyPlugin from 'fastify-plugin';
import { join } from 'path';

export const PATH = '/favicon.ico';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, (_, res) => {
      return res.sendFile('favicon.ico', join(process.cwd(), 'public'));
    });

    done();
  },
  { name: PATH },
);
