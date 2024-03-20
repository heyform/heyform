import reactRefresh from "@vitejs/plugin-react-refresh";
import { resolve } from "path";
import fontOptimizationPlugin from "vite-plugin-font-optimization";

const PROXY_CONFIG = {
	target: 'http://127.0.0.1:8000',
	secure: false,
	changeOrigin: true
}

const htmlInjectionPlugin = () => ({
	name: 'html-injection-plugin',
	apply: 'build',
	async transformIndexHtml(html: string) {
		return html.replace('const heyform = {};', 'const heyform = {{{json rendererData}}};')
	}
})

export default () => ({
	plugins: [
		reactRefresh(),
		htmlInjectionPlugin(),
		fontOptimizationPlugin({
			apply: 'build'
		})
	],
	resolve: {
		alias: [
			{
				find: '@',
				replacement: resolve(__dirname, 'src')
			}
		]
	},
	define: {
		// https://github.com/smnhgn/vite-plugin-package-version/blob/5baa976dbb22917a2bd00dfa25cf05774c229b1d/src/index.ts#L11
		'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
		'process.env': {
			// @heyform-inc/answer-utils
			VALIDATE_CLIENT_SIDE: true
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "./src/styles/base";`
			}
		}
	},
	build: {
		target: 'es2015',
		assetsDir: 'static',
		// https://github.com/vitejs/vite/issues/5759#issuecomment-1034461225
		commonjsOptions: {
		  ignoreTryCatch: false
		}
	},
	server: {
		port: 3000,
		open: 'http://127.0.0.1:3000',
		proxy: {
			'/graphql': PROXY_CONFIG,
			'/upload': PROXY_CONFIG,
			'/image': PROXY_CONFIG
		}
	}
})
