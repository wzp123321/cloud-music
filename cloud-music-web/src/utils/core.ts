import { ElLoading, ElMessage } from 'element-plus';

export const injectDirective = (app: any) => {
  app.use(ElLoading);
  app.use(ElMessage);
}
