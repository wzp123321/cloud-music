import { LoadPlayListParams, BannerRes, PlayListRes, HotSingerRes } from './portal-api';
import { getRequest, postRequest } from '@/services/request';

const portalService = {
  /**
   * 查询首页banner
   * @param params
   */
  async getBannerList(params: { type: number } = { type: 0 }): Promise<BannerRes> {
    const url = '/banner';
    const res: BannerRes = await postRequest(url, params);
    return res;
  },
  /**
   * 查询不同类型歌单
   * @param params
   * @returns
   */
  async getPlayListByType(params: LoadPlayListParams): Promise<PlayListRes> {
    const url = '/top/playlist';
    const res: PlayListRes = await getRequest(url, params);
    return res;
  },
  /**
   * 查询热门歌手
   * @param params
   * @returns
   */
  async getHotSingerList(params: { limit: number }): Promise<HotSingerRes> {
    const url = '/top/artists';
    const res: HotSingerRes = await postRequest(url, params);
    return res;
  },
};

export default portalService;
