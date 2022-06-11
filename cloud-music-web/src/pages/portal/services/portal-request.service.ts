import { LoadPlayListParams, BannerRes, PlayListRes } from './portal-api';
import { postRequest } from '@/services/request';
import { ResTemplate } from '@/services/common-api';

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
    const url = '/top/playlist/highquality';
    const res: PlayListRes = await postRequest(url, params);
    return res;
  },
};

export default portalService;
