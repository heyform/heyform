/** @type {import('tsup').Options} */
module.exports = {
	target: 'esnext',
	dts: true,
	sourcemap: true,
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	splitting: false,
	treeshake: true,
	clean: true
}
