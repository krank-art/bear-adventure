import { rollup } from 'rollup';
import createRollupConfigs from './rollup.config.js';

async function build({ outputDir }) {
  const rollupConfigs = await createRollupConfigs({ outputDir });
  for (const config of rollupConfigs) {
    const bundle = await rollup(config);
    await bundle.write(config.output);
  }
  console.log('Rollup completed successfully.');
}

export default async function buildAssets({ outputDir = "dist"}) {
  await build({ outputDir }).catch((error) => {
    console.error('Rollup encountered an error:', error);
    process.exit(1);
  });
}

await (() => buildAssets({}))();
