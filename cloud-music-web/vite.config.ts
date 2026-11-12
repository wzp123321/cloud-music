import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

// https://vitejs.dev/config/
export default ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  // 部署公共路径，如 /web/cloud-web/
  const publicPath = env.VITE_PUBLIC_PATH || '/';
  // 产物目录只取部署路径最后一段，如 /web/cloud-web/ → dist/cloud-web
  const outDirName = publicPath.split('/').filter(Boolean).pop();
  const outDir = outDirName ? `dist/${outDirName}` : 'dist';

  return defineConfig({
    base: publicPath,
    resolve: {
      // 别名
      alias: [
        {
          find: '@',
          replacement: resolve(__dirname, 'src'),
        },
      ],
      // 支持的后缀
      extensions: ['.js', '.ts', '.tsx', '.jsx', '.vue', '.less'],
    },
    // 开发选项
    server: {
      port: Number(env.VITE_DEV_SERVER_PORT),
      host: '0.0.0.0',
      fs: {
        strict: false, // 解决Unrestricted file system access  vite对根目录的访问做了限制
      },
      proxy: {
        '/api': {
          target: env.VITE_PROXY_URL,
          changeOrigin: true, //是否跨域
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      assetsDir: 'assets', // 静态资源存放路径
      sourcemap: env.VITE_NODE_ENV !== 'production',
      // 产物目录：dist/cloud-web，直接部署到服务器的 /web/cloud-web/ 即可
      outDir,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        input: {
          index: resolve(__dirname, './index.html'),
        },
        output: {
          // vendor 分包：公共依赖各自成块，利于浏览器长缓存
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'element-plus';
            }
            if (id.includes('pinia') || id.includes('/vue') || id.includes('vue-') || id.includes('@vue')) {
              return 'vue-vendor';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            return 'vendor';
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_debugger: command === 'production',
          // 仅移除 log/info/debug，保留 warn/error 便于线上排查
          pure_funcs:
            command === 'production'
              ? ['console.log', 'console.info', 'console.debug']
              : [],
        },
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    plugins: [
      vue({
        // cm-* 原子组件内部渲染原生标签，静态资源路径也需要走 Vite 的资源转换。
        // 显式列出 tags 时须一并保留原生标签的默认映射。
        template: {
          transformAssetUrls: {
            tags: {
              video: ['src', 'poster'],
              source: ['src'],
              img: ['src'],
              image: ['xlink:href', 'href'],
              use: ['xlink:href', 'href'],
              'cm-image': ['src'],
              'cm-video': ['src', 'poster'],
              'cm-audio': ['src'],
            },
          },
        },
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  });
};
