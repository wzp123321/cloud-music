import { BannerVO, BannerRes } from './portal-api';
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
};

export default portalService;
