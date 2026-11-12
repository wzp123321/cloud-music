import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import router from './router/index';
import App from './app.vue';

import registerGlobalComponents from '@/components/register';
import { injectDirective } from '@/utils/core';
// 样式
import 'element-plus/dist/index.css';
import '@/assets/css/index.less';

const pinia = createPinia();
// 播放队列与播放索引由各 store 的 persist 选项负责持久化
pinia.use(piniaPluginPersistedstate);

const app: any = createApp(App);
registerGlobalComponents(app);
injectDirective(app);
app.use(pinia);
app.use(router);
app.mount('#app');
