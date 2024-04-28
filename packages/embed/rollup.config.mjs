import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import css from 'rollup-plugin-import-css'
import postcss from 'rollup-plugin-postcss'
import svg from 'rollup-plugin-svg-import'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'

export default {
  input: ['./src/index.ts'],
  output: {
    format: 'umd',
    file: 'dist/index.umd.js',
    name: 'HeyForm',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    resolve(),
    replace({
      'process.env.npm_package_version': `v${process.env.npm_package_version}`,
      preventAssignment: true
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false
    }),
    svg({
      stringify: true
    }),
    postcss(),
    terser(),
    css()
  ]
};
