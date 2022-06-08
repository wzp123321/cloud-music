import { ElMessage } from 'element-plus';
let messageInstance: any;
const DURATION = 3 * 1000;
const message = {
  success: (message: string) => {
    if (messageInstance) {
      messageInstance.close();
    }
    ElMessage({
      message,
      type: 'success',
      duration: DURATION,
    });
  },
  error: (message: string) => {
    if (messageInstance) {
      messageInstance.close();
    }
    ElMessage({
      message,
      type: 'error',
      duration: DURATION,
    });
  },
  info: (message: string) => {
    if (messageInstance) {
      messageInstance.close();
    }
    ElMessage({
      message,
      type: 'info',
      duration: DURATION,
    });
  },
  loading: (message: string) => {
    if (messageInstance) {
      messageInstance.close();
    }
    ElMessage({
      message,
      type: 'info',
      duration: DURATION,
    });
  },
};

export default message;
