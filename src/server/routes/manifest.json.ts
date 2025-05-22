import { config } from '@/lib/config';
import fastifyPlugin from 'fastify-plugin';
import type { MetadataRoute } from 'next';
import { parse } from 'url';

function generateIcons(sizes: number[]): MetadataRoute.Manifest['icons'] {
  return sizes.map((size) => ({
    src: `/favicon-${size}x${size}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
  }));
}

export const PATH = '/manifest.json';
export default fastifyPlugin(
  (server, _, done) => {
    server.get(PATH, async (req, res) => {
      const parsedUrl = parse(req.url!, true);

      if (!config.pwa.enabled) return req.server.nextServer.render404(req.raw, res.raw, parsedUrl);

      return {
        name: config.pwa.title,
        short_name: config.pwa.shortName,
        description: config.pwa.description,
        theme_color: config.pwa.themeColor,
        background_color: config.pwa.backgroundColor,

        start_url: '/',
        display: 'standalone',
        icons: generateIcons([16, 32, 64, 128, 512]),
      } satisfies MetadataRoute.Manifest;
    });

    done();
  },
  { name: PATH },
);
