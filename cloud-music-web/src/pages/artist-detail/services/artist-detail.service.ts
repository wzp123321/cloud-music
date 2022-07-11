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
import { ref } from 'vue';

class ArtistDetail {
  //#region
  private _id = 0;
  private _artistVO?: ArtistVO;
  private _loading = ref<boolean>(false);
  private _is_error = ref<boolean>(false);
  //#endregion
  //#region
  public get id(): number {
    return this._id;
  }
  public get artistVO(): ArtistVO {
    return this._artistVO as ArtistVO;
  }
  public get loading(): boolean {
    return this._loading.value;
  }
  public get is_error(): boolean {
    return this._is_error.value;
  }
  //#endregion
  //#region
  async init() {
    this._id = Number(FGetQueryParam('id'));
    this._loading.value = true;
    this._is_error.value = false;
    try {
      const res = await artistDetailService.getArtistDetail({
        id: this._id,
      });
      const result = FResHandler<ArtistVO>(res);
      if (result) {
        this._artistVO = result;
      }
    } catch (error) {
      this._is_error.value = true;
    } finally {
      this._loading.value = false;
    }
  }
  //#endregion
}

export default new ArtistDetail();
