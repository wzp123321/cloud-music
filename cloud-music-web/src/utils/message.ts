import { ElMessage } from 'element-plus';
// ElMessage 返回的 handler 提供 close()，用于关闭上一条常驻消息
let messageInstance: ReturnType<typeof ElMessage> | undefined;
const DURATION = 3 * 1000;
// loading 不应自消：duration 0 表示常驻，直到下一次 success/error/info 覆盖
const LOADING_DURATION = 0;

const show = (
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  duration: number,
) => {
  // 关闭上一条，避免堆叠；messageInstance 始终指向当前实例
  if (messageInstance) {
    messageInstance.close();
  }
  messageInstance = ElMessage({ message, type, duration });
};

const message = {
  success: (message: string) => show('success', message, DURATION),
  error: (message: string) => show('error', message, DURATION),
  info: (message: string) => show('info', message, DURATION),
  loading: (message: string) => show('info', message, LOADING_DURATION),
};

export default message;
