/*
 * @Descrption: 歌手详情服务
 * @Author: wanzp
 * @Date: 2022-07-06 21:40:47
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:40:20
 */
import { FGetQueryParam } from '@/core/token';
import artistDetailService from './ad.service';

import { ArtistVO, AlbumVO, MvVO, DescRes } from './artist-detail-api';
import { Common_IMusic } from '@/services/common-api/common-api';
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
  private _songs = ref<Common_IMusic[]>([]);
  private _selectedCode = ref<string>(navs[0].code);
  private _albumList = ref<AlbumVO[]>([]);
  private _mvList = ref<MvVO[]>([]);
  private _itemLoading = ref<boolean>(false);
  private _desc = ref<DescRes>({
    briefDesc: '',
    code: 0,
    count: 0,
    introduction: [],
    topicData: [],
  });
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
  public get songs(): Common_IMusic[] {
    return this._songs.value;
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
  public get albumList(): AlbumVO[] {
    return this._albumList.value;
  }
  public get mvList(): MvVO[] {
    return this._mvList.value;
  }
  public get itemLoading(): boolean {
    return this._itemLoading.value;
  }
  public get desc(): DescRes {
    return this._desc.value;
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
        this._songs.value = res?.hotSongs?.map((item) => {
          return {
            dt: item?.dt,
            url: '',
            name: item?.name,
            alName: item?.al?.name ?? '',
            artist: item?.ar?.[0]?.name,
            picUrl: item?.al?.picUrl,
            id: item?.id,
          };
        });
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
    switch (this._selectedCode.value) {
      case '1':
        this.queryArtistAlbum();
        break;
      case '2':
        this.queryArtistMV();
        break;
      case '3':
        this.queryArtistDesc();
        break;
    }
  };
  //#endregion
  //#region
  async queryArtistAlbum() {
    if (this._albumList.value?.length) {
      return;
    }
    this._is_error.value = false;
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
      this._is_error.value = true;
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
    this._is_error.value = false;
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
      this._is_error.value = true;
    } finally {
      setTimeout(() => {
        this._itemLoading.value = false;
      }, 300);
    }
  }
  //#endregion
  //#region
  async queryArtistDesc() {
    if (this._desc.value?.briefDesc) {
      return;
    }
    this._is_error.value = false;
    this._itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistDesc({
        id: this._id,
      });
      if (res?.code === 200) {
        this._desc.value = res;
      } else {
        this._desc.value = {
          briefDesc: '',
          code: 0,
          count: 0,
          introduction: [],
          topicData: [],
        };
      }
    } catch (error) {
      this._is_error.value = true;
      this._desc.value = {
        briefDesc: '',
        code: 0,
        count: 0,
        introduction: [],
        topicData: [],
      };
    } finally {
      this._itemLoading.value = false;
    }
  }
  //#endregion
}

export default new ArtistDetail();
