import { ElLoading, ElMessage } from 'element-plus';
import type { App } from 'vue';

export const injectDirective = (app: App) => {
  app.use(ElLoading);
  app.use(ElMessage);
}
