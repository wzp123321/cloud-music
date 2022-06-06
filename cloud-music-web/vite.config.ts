import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // 开发选项
  server: {
    port: 9527,
    host: '0.0.0.0',
    fs: {
      strict: false, // 解决Unrestricted file system access  vite对根目录的访问做了限制
    },
  },
  plugins: [vue()],
})
