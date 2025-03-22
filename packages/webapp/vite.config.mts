import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import { ConfigEnv, loadEnv } from 'vite'
import svgr from 'vite-plugin-svgr'
import webfontDownload from 'vite-plugin-webfont-dl'
import { analyzer } from 'vite-bundle-analyzer'

export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd())
  const plugins = [
    react(),
    svgr(),
    webfontDownload(['https://rsms.me/inter/inter.css'])
  ]

  if (process.env.ANALYZER) {
    plugins.push(analyzer())
  }

  return {
    assetsInclude: ['**/*.svg'],
    plugins,
    define: {
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
      'process.env': {
        VALIDATE_CLIENT_SIDE: true
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    build: {
      target: 'es2015',
      assetsDir: 'static',
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-router-dom',
              'react-dom',
              'axios',
              '@sentry/react',
              'i18next',
              'i18next-browser-languagedetector',
              'react-i18next'
            ],
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-visually-hidden',
              'react-flow-renderer',
              'react-resizable-panels',
              'react-sortablejs',
              'qrcode.react'
            ],
            heyform: [
              '@heyooo-inc/react-router',
              '@heyform-inc/answer-utils',
              '@heyform-inc/shared-types-enums',
              '@heyform-inc/utils'
            ]
          }
        }
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/graphql': {
          target: env.VITE_PROXY_TARGET,
          secure: false,
          changeOrigin: true,
          cookieDomainRewrite: {
            [env.VITE_COOKIE_DOMAIN_REWRITE]: env.VITE_COOKIE_DOMAIN
          },
          // Remove `Secure` and `SameSite from proxyRes's `set-cookie`
          // https://vitejs.dev/config/#server-proxy
          configure: (proxy: any) => {
            proxy.on('proxyReq', function(proxyReq: any) {
              proxyReq.setHeader('Authorization', 'Basic cm9vdDo2NjY=')
            })

            // https://github.com/http-party/node-http-proxy/pull/1166#issuecomment-328764776
            proxy.on('proxyRes', function(proxyRes: any) {
              const removeSecure = (str: string) => str.replace(/; Secure|; SameSite=[^;]/gi, '')
              const set = proxyRes.headers['set-cookie']

              if (set) {
                proxyRes.headers['set-cookie'] = Array.isArray(set)
                  ? set.map(removeSecure)
                  : removeSecure(set)
              }
            })
          }
        },
        '/api': {
          target: env.VITE_PROXY_TARGET,
          secure: false,
          changeOrigin: true,
          // https://vitejs.dev/config/#server-proxy
          configure: (proxy: any) => {
            proxy.on('proxyReq', function(proxyReq: any) {
              proxyReq.setHeader('Authorization', 'Basic cm9vdDo2NjY=')
            })
          }
        }
      }
    }
  }
}
