import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

// https://vitejs.dev/config/
export default ({ mode, command }) => {
  return defineConfig({
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
      port: Number(loadEnv(mode, process.cwd()).VITE_DEV_SERVER_PORT),
      host: '0.0.0.0',
      fs: {
        strict: false, // 解决Unrestricted file system access  vite对根目录的访问做了限制
      },
      proxy: {
        '/api': {
          target: loadEnv(mode, process.cwd()).VITE_PROXY_URL,
          changeOrigin: true, //是否跨域
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      assetsDir: 'assets', // 静态资源存放路径
      sourcemap: loadEnv(mode, process.cwd()).VITE_NODE_ENV !== 'production',
      outDir: 'dist/ems-admin',
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
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  });
};
