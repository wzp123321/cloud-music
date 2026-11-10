import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from './router/index';
import App from './app.vue';

import registerGlobalComponnents from '@/components/register';
import { injectDirective } from '@/utils/core';
// 样式
import 'element-plus/dist/index.css';
import '@/assets/css/index.less';

const pinia = createPinia();
// 播放队列与播放索引沿用旧 localStorage key，由各 store 的 persist 选项控制
pinia.use(piniaPluginPersistedstate);

const app: any = createApp(App);
registerGlobalComponnents(app);
injectDirective(app);
app.use(pinia);
app.use(router);
app.mount('#app');
