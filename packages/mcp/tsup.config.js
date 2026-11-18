/** @type {import('tsup').Options} */
module.exports = {
  target: 'node20',
  platform: 'node',
  sourcemap: true,
  entry: ['src/index.ts'],
  format: ['cjs'],
  splitting: false,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node'
  }
}
