import { getRequest } from '@/apis/request';

const musicService = {
  /**
   * 获取歌词
   * @param params
   * @returns
   */
  getLyricById: async (params: { id: number }) => {
    const url = '/lyric';
    const res = await getRequest(url, params);
    return res;
  },
  /**
   * 获取歌词
   * @param params
   * @returns
   */
  getSongDownloadUrl: async (params: { id: number }) => {
    const url = '/song/download/url';
    const res = await getRequest(url, params);
    return res;
  },
};

export default musicService;
