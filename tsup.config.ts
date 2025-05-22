import glob from 'fast-glob';
import { defineConfig } from 'tsup';
import { replaceTscAliasPaths } from 'tsc-alias';
import { copyFile, mkdir } from 'fs/promises';

export default defineConfig(async (_) => {
  return [
    {
      platform: 'node',
      format: 'cjs',
      clean: true,
      sourcemap: true,
      entry: await glob('./src/**/*.ts', {
        ignore: ['./src/components/**/*.ts', './src/pages/**/*.ts'],
      }),
      outDir: 'build',
      bundle: false,
      onSuccess: async () => {
        console.log('[ts] replacing ts paths...');
        await replaceTscAliasPaths({
          configFile: 'tsconfig.json',
          outDir: 'build',
        });

        console.log('[built-ins] copying builtins...');
        const builtins = await glob('./src/lib/theme/builtins/*.theme.json');

        await mkdir('./build/lib/theme/builtins', { recursive: true });
        for (const builtin of builtins) {
          await copyFile(builtin, builtin.replace('./src/', './build/'));
        }
      },
    },
  ];
});
