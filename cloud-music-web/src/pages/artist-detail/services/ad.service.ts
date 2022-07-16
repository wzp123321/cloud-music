import { getRequest } from '@/services/request';

import { ArtistVO, AlbumRes, MVRes, DescRes } from './artist-detail-api';

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
  /**
   * 获取歌手专辑列表
   * @param params
   * @returns
   */
  async getArtistAlbumList(params: { id: number }): Promise<AlbumRes> {
    const url = '/artist/album';
    const res: AlbumRes = await getRequest(url, params);
    return res;
  },
  /**
   * 获取歌手MV
   * @param params
   * @returns
   */
  async getArtistMVList(params: { id: number }): Promise<MVRes> {
    const url = '/artist/mv';
    const res: MVRes = await getRequest(url, params);
    return res;
  },
  /**
   * 获取歌手描述
   * @param params
   * @returns
   */
  async getArtistDesc(params: { id: number }): Promise<DescRes> {
    const url = '/artist/desc';
    const res: DescRes = await getRequest(url, params);
    return res;
  },
};

export default artistDetailService;
