import { createApp } from 'vue';
import router from './router/index';
import store from './store/index';
import App from './app.vue';

import registerGlobalComponnents from '@/components/register';
// 样式
import 'element-plus/dist/index.css';
import '@/assets/css/index.less';

const app: any = createApp(App);
registerGlobalComponnents(app);
app.use(router);
app.use(store).mount('#app');
