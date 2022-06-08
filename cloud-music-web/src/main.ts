import { createApp } from 'vue';
import router from './router/index';
import store from './store/index';
import App from './app.vue';

import 'element-plus/dist/index.css';
import '@/assets/css/index.less';

const app = createApp(App);
app.use(router);
app.use(store).mount('#app');
