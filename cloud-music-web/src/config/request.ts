const timeout = 60 * 1000; // 接口超时时长
const env = (import.meta.env.VITE_NODE_ENV as string) || 'production';
const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '/';
/**
 * 网关配置
 */
const gateWayConfig: {
  [key: string]: { baseUrl: string; publicPath: string };
} = {
  development: {
    baseUrl,
    publicPath: '/',
  },
  production: {
    baseUrl,
    publicPath: '/imsManage',
  },
};

export default { ...gateWayConfig[env], timeout };
