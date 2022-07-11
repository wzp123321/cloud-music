import { getRequest } from '@/services/request';

import { ArtistVO } from './artist-detail-api';
import { ResTemplate } from '@/services/common-api/common-api';

const artistDetailService = {
  /**
   * 获取歌手详情
   * @param params
   * @returns
   */
  async getArtistDetail(params: { id: number }): Promise<ArtistVO> {
    const url = '/artists';
    const res: ArtistVO = await getRequest(url, params);
    return res;
  },
};

export default artistDetailService;
