import path from 'path';
import copy from 'rollup-plugin-copy';

export default ({ outputDir }) => {
  return {
    input: 'lib/main.js',
    output: {
      file: outputDir + "/bundle.js",
      format: 'iife',
    },
    plugins: [
      copy({
        targets: [
          { src: 'static/*', dest: outputDir },
          { src: 'graphics/*', dest: path.join(outputDir, "assets") },
          { src: 'data/*', dest: path.join(outputDir, "assets") },
        ],
      }),
    ],
  }
};
