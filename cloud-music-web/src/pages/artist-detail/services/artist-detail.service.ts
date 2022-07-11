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
import { ref } from 'vue';

const navs = [
  {
    code: '0',
    name: '单曲',
  },
  {
    code: '1',
    name: '专辑',
  },
  {
    code: '2',
    name: 'MV',
  },
  {
    code: '3',
    name: '简介',
  },
];

class ArtistDetail {
  //#region
  private _id = 0;
  private _artistVO?: ArtistVO;
  private _loading = ref<boolean>(false);
  private _is_error = ref<boolean>(false);
  private _selectedCode = ref<string>(navs[0].code);
  private _page = ref<number>(1);
  public readonly navs = navs;
  public readonly pageSize = 20;
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
  public get selectedCode(): string {
    return this._selectedCode.value;
  }
  public set selectedCode(value: string) {
    this._selectedCode.value = value;
  }
  public get page(): number {
    return this._page.value;
  }
  public set page(value: number) {
    this._page.value = value;
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
      if (res) {
        this._artistVO = res;
      }
    } catch (error) {
      this._is_error.value = true;
    } finally {
      this._loading.value = false;
    }
  }
  //#endregion
  //#region
  handleNavChange() {
    this._page.value = 1;
  }
  //#endregion
}

export default new ArtistDetail();
