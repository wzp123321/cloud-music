import { createApp, type App as AppInstance } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from './router/index';
import App from './app.vue';

import registerGlobalComponents from '@/components/register';
import { injectDirective } from '@/utils/core';
// 样式：ElMessage / ElLoading / ElMessageBox 为显式 import，auto-import resolver 不会为其注入样式，
// 故保留全量 CSS，避免命令式组件与全局提示丢失样式；JS 巨块拆分交给 vite.config.ts 的 manualChunks。
// 顺序：EP 基础 CSS → EP 官方暗色变量(html.dark) → 项目令牌(覆盖品牌红，后加载者胜)。
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import '@/assets/css/index.less';

const pinia = createPinia();
// 播放队列与播放索引由各 store 的 persist 选项负责持久化
pinia.use(piniaPluginPersistedstate);

// 挂载前先落一次主题：深色用户在首帧就能拿到正确配色，避免白屏闪一下。
// 这里直接读 localStorage，不能等 setting store 创建（那要等 header 挂载）。
// data-theme 供业务与调试读取，class="dark" 供 EP 官方暗色变量命中。
try {
  const stored = JSON.parse(localStorage.getItem('cloud-setting') ?? '{}') as { theme?: string };
  const dark =
    stored.theme === 'dark' ||
    (stored.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', dark);
} catch {
  document.documentElement.dataset.theme = 'light';
  document.documentElement.classList.remove('dark');
}

const app: AppInstance = createApp(App);
registerGlobalComponents(app);
injectDirective(app);
app.use(pinia);
app.use(router);
app.mount('#app');
