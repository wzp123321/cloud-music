import { ElLoading, ElMessage } from 'element-plus';

export function injectDirective(app: any) {
  app.use(ElLoading);
  app.use(ElMessage);
}
