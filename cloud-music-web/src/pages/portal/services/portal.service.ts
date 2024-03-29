/*
 * @Description： 首页服务
 * @Author: wanzp
 * @Date: 2022-06-09 22:02:59
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 21:39:49
 */
import { ref } from 'vue';
import router from '@/router';

import { BannerVO, BannerRes, PlayListRes, PlayListVO, HotSingerRes, SingerVO } from './portal-api';

import portalService from './portal-request.service';

import { TARGET_TYPE } from '@/config/enum';

import { recommendPlayListNavs } from '../constant/index';

class PortService {
  //#region
  private _loading = ref<boolean>(false);
  private _bannerList = ref<BannerVO[]>([]);
  public readonly recommendPlayListNavs = recommendPlayListNavs; // 推荐歌单类型
  private _selectedRecommendPlayListType = ref<string>(recommendPlayListNavs[0].code);
  private _playList = ref<PlayListVO[]>([]);
  private _hotSingerList = ref<SingerVO[]>([]);
  private _surgeRankVO = ref<PlayListVO | null>(null); // 飙升榜
  private _newMusicRankVO = ref<PlayListVO | null>(null); // 新歌榜
  private _hotMusicRankVO = ref<PlayListVO | null>(null); // 热歌榜
  private _eaMusicRankVO = ref<PlayListVO | null>(null); // 欧美
  private _krjpMusicRankVO = ref<PlayListVO | null>(null); // 日韩
  //#endregion
  //#region
  public get loading(): boolean {
    return this._loading.value;
  }
  public get bannerList(): BannerVO[] {
    return this._bannerList.value;
  }
  public get selectedRecommendPlayListType(): string {
    return this._selectedRecommendPlayListType.value;
  }
  public set selectedRecommendPlayListType(value: string) {
    this._selectedRecommendPlayListType.value = value;
  }
  public get surgeRankVO(): PlayListVO | null {
    return this._surgeRankVO.value;
  }
  public get newMusicRankVO(): PlayListVO | null {
    return this._newMusicRankVO.value;
  }
  public get hotMusicRankVO(): PlayListVO | null {
    return this._hotMusicRankVO.value;
  }
  public get eaMusicRankVO(): PlayListVO | null {
    return this._eaMusicRankVO.value;
  }
  public get krjpMusicRankVO(): PlayListVO | null {
    return this._krjpMusicRankVO.value;
  }
  public get playList(): PlayListVO[] {
    return this._playList.value;
  }
  public get hotSingerList(): SingerVO[] {
    return this._hotSingerList.value;
  }
  //#endregion
  //#region
  init() {
    this._loading.value = true;
    this.queryBannerLsit();
    this.queryPlayListByType();
    this.queryHotSinger();
    this.getSomeRankList();
  }
  //#endregion
  //#region
  async queryBannerLsit() {
    try {
      const res: BannerRes = await portalService.getBannerList();
      if (res?.code === 200 && res?.banners?.length) {
        this._bannerList.value = res?.banners;
      } else {
        this._bannerList.value = [];
      }
    } catch (error) {
      this._bannerList.value = [];
    }
  }
  //#endregion
  //#region banner跳转
  handleBannerLinkTo(url: string, targetType: number, targetId: number) {
    let path = '';
    switch (targetType) {
      case TARGET_TYPE.单曲:
        path = '/music_detail';
        break;
      case TARGET_TYPE.专辑:
        path = '/ablum_detail';
        break;
      case TARGET_TYPE.歌单:
        path = '/playlist_detail';

      case TARGET_TYPE.独家规划:
        break;
    }
    router.push({
      path,
      query: {
        targetId,
      },
    });
  }
  //#endregion
  //#region 加载不同类型歌单
  queryPlayListByType = async () => {
    try {
      const params = {
        limit: 15,
        cat: this._selectedRecommendPlayListType.value,
      };
      const res: PlayListRes = await portalService.getPlayListByType(params);
      if (res?.code === 200) {
        this._playList.value = res?.playlists.slice(0, 15);
      } else {
        this._playList.value = [];
      }
    } catch (error) {
      this._playList.value = [];
    }
  };
  //#endregion
  //#region 热门歌手
  async queryHotSinger() {
    try {
      const res: HotSingerRes = await portalService.getHotSingerList({ limit: 10 });
      if (res?.code === 200) {
        this._hotSingerList.value = res?.artists.slice(0, 10);
      } else {
        this._hotSingerList.value = [];
      }
    } catch (error) {
      this._hotSingerList.value = [];
    }
  }
  //#endregion
  //#region 新碟
  /**
   * 19723756 飙升
   * 3779629 新歌
   * 3778678 热歌
   * 2809513713 欧美
   * 745956260 韩语
   */
  async getSomeRankList() {
    try {
      const types = [19723756, 3779629, 3778678, 2809513713, 745956260];
      const promiseArr = types.map((item) => {
        return portalService.getRankDetailById({ id: item });
      });
      const resArr = await Promise.all(promiseArr);
      if (resArr?.length) {
        this._surgeRankVO.value = {
          ...resArr[0].playlist,
          tracks: resArr[0].playlist?.tracks.splice(0, 5),
        };
        this._newMusicRankVO.value = {
          ...resArr[1].playlist,
          tracks: resArr[1].playlist?.tracks.splice(0, 5),
        };
        this._hotMusicRankVO.value = {
          ...resArr[2].playlist,
          tracks: resArr[2].playlist?.tracks.splice(0, 5),
        };
        this._eaMusicRankVO.value = {
          ...resArr[3].playlist,
          tracks: resArr[3].playlist?.tracks.splice(0, 5),
        };
        this._krjpMusicRankVO.value = {
          ...resArr[4].playlist,
          tracks: resArr[4].playlist?.tracks.splice(0, 5),
        };
      } else {
        this._surgeRankVO.value = null;
        this._newMusicRankVO.value = null;
        this._hotMusicRankVO.value = null;
        this._eaMusicRankVO.value = null;
        this._krjpMusicRankVO.value = null;
      }
    } catch (error) {
      this._surgeRankVO.value = null;
      this._newMusicRankVO.value = null;
      this._hotMusicRankVO.value = null;
      this._eaMusicRankVO.value = null;
      this._krjpMusicRankVO.value = null;
    }
  }
  //#endregion
  //#region
  linkToAritstDetail(id: number) {
    router.push({
      path: '/artist_detail',
      query: {
        id,
      },
    });
  }
}

export default new PortService();
