/*
 * @Descrption: 歌手详情服务
 * @Author: wanzp
 * @Date: 2022-07-06 21:40:47
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-06 21:42:21
 */
import { FGetQueryParam } from '@/utils/token';
import artistDetailService from './ad.service';

import { ArtistVO } from './artist-detail-api';
import { FResHandler } from '@/utils';

class ArtistDetail {
  //#region
  private _id = 0;
  private _artistVO?: ArtistVO;
  private _loading = false;
  private _is_error = false;
  //#endregion
  //#region
  public id(): number {
    return this._id;
  }
  public artistVO(): ArtistVO {
    return this._artistVO as ArtistVO;
  }
  public loading(): boolean {
    return this._loading;
  }
  public is_error(): boolean {
    return this._is_error;
  }
  //#endregion
  //#region
  async init() {
    this._id = Number(FGetQueryParam('id'));
    this._loading = true;
    this._is_error = false;
    try {
      const res = await artistDetailService.getArtistDetail({
        id: this._id,
      });
      const result = FResHandler<ArtistVO>(res);
      if (result) {
        this._artistVO = result;
      }
    } catch (error) {
      this._is_error = true;
    } finally {
      this._loading = false;
    }
  }
  //#endregion
}

export default new ArtistDetail();
