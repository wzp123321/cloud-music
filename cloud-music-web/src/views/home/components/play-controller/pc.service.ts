import { getRequest } from '@/services/request';
const musicService = {
  async getSongUrlByIds(params: { id: string }) {
    const url = '/song/url';
    const res = await getRequest(url, params);
    return res;
  },
};

export default musicService;
