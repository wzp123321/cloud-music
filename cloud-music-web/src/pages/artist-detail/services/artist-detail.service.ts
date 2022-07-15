/*
 * @Descrption: 歌手详情服务
 * @Author: wanzp
 * @Date: 2022-07-06 21:40:47
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-15 21:18:57
 */
import { FGetQueryParam } from '@/core/token';
import artistDetailService from './ad.service';

import { ArtistVO, AlbumVO, MvVO } from './artist-detail-api';
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
  private _total = ref<number>(1);
  private _albumList = ref<AlbumVO[]>([]);
  private _mvList = ref<MvVO[]>([]);
  private _itemLoading = ref<boolean>(false);
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
  public get total(): number {
    return this._total.value;
  }
  public get albumList(): AlbumVO[] {
    return this._albumList.value;
  }
  public get mvList(): MvVO[] {
    return this._mvList.value;
  }
  public get itemLoading(): boolean {
    return this._itemLoading.value;
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
        this._total.value = res?.hotSongs?.length;
      }
    } catch (error) {
      this._is_error.value = true;
    } finally {
      this._loading.value = false;
    }
  }
  //#endregion
  //#region
  handleNavChange = () => {
    this._page.value = 1;
    switch (this._selectedCode.value) {
      case '1':
        this.queryArtistAlbum();
        break;
      case '2':
        this.queryArtistMV();
        break;
    }
  };
  //#endregion
  //#region
  handleSongsPageChange = (value: number) => {
    this._page.value = value;
  };
  //#endregion
  //#region
  async queryArtistAlbum() {
    if (this._albumList.value?.length) {
      return;
    }
    this._itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistAlbumList({
        id: this._id,
      });
      if (res?.hotAlbums?.length) {
        this._albumList.value = res?.hotAlbums;
      } else {
        this._albumList.value = [];
      }
    } catch (error) {
      this._albumList.value = [];
    } finally {
      setTimeout(() => {
        this._itemLoading.value = false;
      }, 300);
    }
  }
  //#endregion
  //#region
  async queryArtistMV() {
    if (this._mvList.value?.length) {
      return;
    }
    this._itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistMVList({
        id: this._id,
      });
      console.log(res);
      if (res?.mvs?.length) {
        this._mvList.value = res?.mvs;
      } else {
        this._mvList.value = [];
      }
    } catch (error) {
      this._mvList.value = [];
    } finally {
      setTimeout(() => {
        this._itemLoading.value = false;
      }, 300);
    }
  }
  //#endregion
}

export default new ArtistDetail();
