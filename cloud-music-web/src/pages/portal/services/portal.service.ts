/*
 * @Description： 首页服务
 * @Author: wanzp
 * @Date: 2022-06-09 22:02:59
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 21:39:49
 */
import { ref } from 'vue';
import router from '@/router';

import {
  BannerVO,
  BannerRes,
  PlayListRes,
  PlayListVO,
  HotSingerRes,
  SingerVO,
  HomepageBlock,
  DragonBallItem,
  PersonalizedItem,
  PersonalizedNewSongItem,
  PersonalizedDjItem,
  PersonalizedMvItem,
  PersonalizedPrivateItem,
  RecommendResourceItem,
  RecommendSongItem,
  TopListItem,
  TopListTrack,
  HighqualityItem,
  TopSongItem,
  TopMvItem,
} from './portal-api';

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
  //#region 首页推荐流新增状态
  private _blockPageList = ref<HomepageBlock[]>([]); // 区块瀑布流
  private _blockPageError = ref<boolean>(false); // 区块瀑布流是否整体失败
  private _dragonBallList = ref<DragonBallItem[]>([]); // 金刚区
  private _personalizedList = ref<PersonalizedItem[]>([]); // 推荐歌单
  private _newSongList = ref<PersonalizedNewSongItem[]>([]); // 推荐新歌
  private _djProgramList = ref<PersonalizedDjItem[]>([]); // 推荐电台(播客)
  private _personalizedMvList = ref<PersonalizedMvItem[]>([]); // 推荐 MV
  private _privateContentList = ref<PersonalizedPrivateItem[]>([]); // 独家放送
  private _recommendResourceList = ref<RecommendResourceItem[]>([]); // 每日推荐歌单
  private _recommendSongList = ref<RecommendSongItem[]>([]); // 每日推荐歌曲
  private _toplist = ref<TopListItem[]>([]); // 所有榜单
  private _selectedRankId = ref<number | null>(null); // 当前选中榜单 id
  private _rankTrackList = ref<TopListTrack[]>([]); // 选中榜单歌曲
  private _highqualityList = ref<HighqualityItem[]>([]); // 精品歌单
  private _topSongList = ref<TopSongItem[]>([]); // 新歌速递
  private _topMvList = ref<TopMvItem[]>([]); // MV 排行榜
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
  //#region 首页推荐流新增 getter
  public get blockPageList(): HomepageBlock[] {
    return this._blockPageList.value;
  }
  public get blockPageError(): boolean {
    return this._blockPageError.value;
  }
  public get dragonBallList(): DragonBallItem[] {
    return this._dragonBallList.value;
  }
  public get personalizedList(): PersonalizedItem[] {
    return this._personalizedList.value;
  }
  public get newSongList(): PersonalizedNewSongItem[] {
    return this._newSongList.value;
  }
  public get djProgramList(): PersonalizedDjItem[] {
    return this._djProgramList.value;
  }
  public get personalizedMvList(): PersonalizedMvItem[] {
    return this._personalizedMvList.value;
  }
  public get privateContentList(): PersonalizedPrivateItem[] {
    return this._privateContentList.value;
  }
  public get recommendResourceList(): RecommendResourceItem[] {
    return this._recommendResourceList.value;
  }
  public get recommendSongList(): RecommendSongItem[] {
    return this._recommendSongList.value;
  }
  public get toplist(): TopListItem[] {
    return this._toplist.value;
  }
  public get selectedRankId(): number | null {
    return this._selectedRankId.value;
  }
  public get rankTrackList(): TopListTrack[] {
    return this._rankTrackList.value;
  }
  public get highqualityList(): HighqualityItem[] {
    return this._highqualityList.value;
  }
  public get topSongList(): TopSongItem[] {
    return this._topSongList.value;
  }
  public get topMvList(): TopMvItem[] {
    return this._topMvList.value;
  }
  //#endregion
  //#region
  init() {
    this._loading.value = true;
    this.queryBannerLsit();
    this.queryPlayListByType();
    this.queryHotSinger();
    this.getSomeRankList();
    // 首页推荐流
    this.queryBlockPage();
    this.queryDragonBall();
    this.queryPersonalized();
    this.queryNewSong();
    this.queryDjProgram();
    this.queryPersonalizedMv();
    this.queryPrivateContent();
    this.queryRecommendResource();
    this.queryRecommendSongs();
    this.queryToplist();
    this.queryTopPlaylistHighquality();
    this.queryTopSong();
    this.queryTopMv();
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
        path = '/album_detail';
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
  //#region 首页推荐流取数
  // 区块瀑布流
  async queryBlockPage() {
    try {
      const res = await portalService.getHomepageBlockPage({ refresh: false });
      if (res?.code === 200 && res?.data?.blocks?.length) {
        this._blockPageList.value = res.data.blocks;
        this._blockPageError.value = false;
      } else {
        this._blockPageList.value = [];
        this._blockPageError.value = true;
      }
    } catch (error) {
      this._blockPageList.value = [];
      this._blockPageError.value = true;
    }
  }
  // 金刚区
  async queryDragonBall() {
    try {
      const res = await portalService.getHomepageDragonBall();
      const list = res?.data?.ballList || res?.ballList || [];
      this._dragonBallList.value = list;
    } catch (error) {
      this._dragonBallList.value = [];
    }
  }
  // 推荐歌单
  async queryPersonalized(limit = 10) {
    try {
      const res = await portalService.getPersonalized({ limit });
      this._personalizedList.value = res?.result?.slice(0, limit) || [];
    } catch (error) {
      this._personalizedList.value = [];
    }
  }
  // 推荐新歌
  async queryNewSong(limit = 10) {
    try {
      const res = await portalService.getPersonalizedNewSong({ limit });
      this._newSongList.value = res?.result?.slice(0, limit) || [];
    } catch (error) {
      this._newSongList.value = [];
    }
  }
  // 推荐电台(播客)
  async queryDjProgram() {
    try {
      const res = await portalService.getPersonalizedDjProgram();
      this._djProgramList.value = res?.result?.slice(0, 6) || [];
    } catch (error) {
      this._djProgramList.value = [];
    }
  }
  // 推荐 MV
  async queryPersonalizedMv() {
    try {
      const res = await portalService.getPersonalizedMv();
      this._personalizedMvList.value = res?.result?.slice(0, 6) || [];
    } catch (error) {
      this._personalizedMvList.value = [];
    }
  }
  // 独家放送
  async queryPrivateContent() {
    try {
      const res = await portalService.getPersonalizedPrivatecontent();
      this._privateContentList.value = res?.result?.slice(0, 6) || [];
    } catch (error) {
      this._privateContentList.value = [];
    }
  }
  // 每日推荐歌单
  async queryRecommendResource() {
    try {
      const res = await portalService.getRecommendResource();
      this._recommendResourceList.value = res?.recommend?.slice(0, 10) || [];
    } catch (error) {
      this._recommendResourceList.value = [];
    }
  }
  // 每日推荐歌曲
  async queryRecommendSongs() {
    try {
      const res = await portalService.getRecommendSongs();
      this._recommendSongList.value = res?.data?.dailySongs || [];
    } catch (error) {
      this._recommendSongList.value = [];
    }
  }
  // 所有榜单
  async queryToplist() {
    try {
      const res = await portalService.getToplist();
      this._toplist.value = res?.list || [];
      // 默认选中第一个官方榜单
      if (!this._selectedRankId.value && this._toplist.value.length) {
        this._selectedRankId.value = this._toplist.value[0].id || null;
        if (this._selectedRankId.value) {
          this.queryRankDetail(this._selectedRankId.value);
        }
      }
    } catch (error) {
      this._toplist.value = [];
    }
  }
  // 单个榜单详情
  async queryRankDetail(id: number) {
    try {
      this._selectedRankId.value = id;
      const res = await portalService.getTopList({ id });
      this._rankTrackList.value = res?.playlist?.tracks?.slice(0, 20) || [];
    } catch (error) {
      this._rankTrackList.value = [];
    }
  }
  // 精品歌单
  async queryTopPlaylistHighquality(limit = 10) {
    try {
      const res = await portalService.getTopPlaylistHighquality({ limit });
      this._highqualityList.value = res?.playlists?.slice(0, limit) || [];
    } catch (error) {
      this._highqualityList.value = [];
    }
  }
  // 新歌速递
  async queryTopSong(type = 0) {
    try {
      const res = await portalService.getTopSong({ type });
      this._topSongList.value = res?.data?.slice(0, 20) || [];
    } catch (error) {
      this._topSongList.value = [];
    }
  }
  // MV 排行榜
  async queryTopMv(limit = 10) {
    try {
      const res = await portalService.getTopMv({ limit });
      this._topMvList.value = res?.data?.slice(0, limit) || [];
    } catch (error) {
      this._topMvList.value = [];
    }
  }
  // 每日推荐-不感兴趣
  async dislikeRecommendSong(id: number) {
    try {
      await portalService.dislikeRecommendSong({ id });
    } catch (error) {
      // 不感兴趣失败不影响列表
    } finally {
      this._recommendSongList.value = this._recommendSongList.value.filter((item) => item.id !== id);
    }
  }
  //#endregion
  //#region 推荐流跳转
  linkToPlaylist(id?: number | string) {
    if (id == null) return;
    router.push({ path: '/playlist_detail', query: { id: String(id) } });
  }
  linkToSong(id?: number | string) {
    if (id == null) return;
    router.push({ path: '/music_detail', query: { id: String(id) } });
  }
  linkToMv(id?: number | string) {
    if (id == null) return;
    router.push({ path: '/mvplay', query: { mvid: String(id) } });
  }
  linkToAlbum(id?: number | string) {
    if (id == null) return;
    router.push({ path: '/album_detail', query: { id: String(id) } });
  }
  linkToDailyRecommend() {
    router.push({ path: '/daily_recommend' });
  }
  linkToRank() {
    router.push({ path: '/rank' });
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
