/*
 * @Description： 首页服务
 * @Author: wanzp
 * @Date: 2022-06-09 22:02:59
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 21:39:49
 */
import { ref, reactive } from 'vue';
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
} from '../../../apis/portal/portal-api';

import portalService from '../../../apis/portal/portal-request.service';

import { TARGET_TYPE } from '@/config/enum';

import { recommendPlayListNavs } from '../constant/index';

// 首页状态层：以 composable 形式组织，内部用 ref + const 箭头函数
const create = () => {
  //#region 基础状态
  const loading = ref<boolean>(false);
  const bannerList = ref<BannerVO[]>([]);
  const selectedRecommendPlayListType = ref<string>(recommendPlayListNavs[0].code);
  const playList = ref<PlayListVO[]>([]);
  const hotSingerList = ref<SingerVO[]>([]);
  const surgeRankVO = ref<PlayListVO | null>(null); // 飙升榜
  const newMusicRankVO = ref<PlayListVO | null>(null); // 新歌榜
  const hotMusicRankVO = ref<PlayListVO | null>(null); // 热歌榜
  const eaMusicRankVO = ref<PlayListVO | null>(null); // 欧美
  const krjpMusicRankVO = ref<PlayListVO | null>(null); // 日韩
  //#endregion
  //#region 首页推荐流新增状态
  const blockPageList = ref<HomepageBlock[]>([]); // 区块瀑布流
  const blockPageError = ref<boolean>(false); // 区块瀑布流是否整体失败
  const dragonBallList = ref<DragonBallItem[]>([]); // 金刚区
  const personalizedList = ref<PersonalizedItem[]>([]); // 推荐歌单
  const newSongList = ref<PersonalizedNewSongItem[]>([]); // 推荐新歌
  const djProgramList = ref<PersonalizedDjItem[]>([]); // 推荐电台(播客)
  const personalizedMvList = ref<PersonalizedMvItem[]>([]); // 推荐 MV
  const privateContentList = ref<PersonalizedPrivateItem[]>([]); // 独家放送
  const recommendResourceList = ref<RecommendResourceItem[]>([]); // 每日推荐歌单
  const recommendSongList = ref<RecommendSongItem[]>([]); // 每日推荐歌曲
  const toplist = ref<TopListItem[]>([]); // 所有榜单
  const selectedRankId = ref<number | null>(null); // 当前选中榜单 id
  const rankTrackList = ref<TopListTrack[]>([]); // 选中榜单歌曲
  const highqualityList = ref<HighqualityItem[]>([]); // 精品歌单
  const topSongList = ref<TopSongItem[]>([]); // 新歌速递
  const topMvList = ref<TopMvItem[]>([]); // MV 排行榜
  //#endregion

  //#region 初始化：聚合首页全部取数入口
  const init = () => {
    loading.value = true;
    queryBannerLsit();
    queryPlayListByType();
    queryHotSinger();
    getSomeRankList();
    // 首页推荐流
    queryBlockPage();
    queryDragonBall();
    queryPersonalized();
    queryNewSong();
    queryDjProgram();
    queryPersonalizedMv();
    queryPrivateContent();
    queryRecommendResource();
    queryRecommendSongs();
    queryToplist();
    queryTopPlaylistHighquality();
    queryTopSong();
    queryTopMv();
  };
  //#endregion
  //#region
  const queryBannerLsit = async () => {
    try {
      const res: BannerRes = await portalService.getBannerList();
      if (res?.code === 200 && res?.banners?.length) {
        bannerList.value = res?.banners;
      } else {
        bannerList.value = [];
      }
    } catch {
      bannerList.value = [];
    }
  };
  //#endregion
  //#region banner跳转
  const handleBannerLinkTo = (_url: string, targetType: number, targetId: number) => {
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
        break;

      case TARGET_TYPE.独家规划:
        break;
    }
    router.push({
      path,
      query: {
        targetId,
      },
    });
  };
  //#endregion
  //#region 加载不同类型歌单
  const queryPlayListByType = async () => {
    try {
      const params = {
        limit: 15,
        cat: selectedRecommendPlayListType.value,
      };
      const res: PlayListRes = await portalService.getPlayListByType(params);
      if (res?.code === 200) {
        playList.value = res?.playlists.slice(0, 15);
      } else {
        playList.value = [];
      }
    } catch {
      playList.value = [];
    }
  };
  //#endregion
  //#region 热门歌手
  const queryHotSinger = async () => {
    try {
      const res: HotSingerRes = await portalService.getHotSingerList({ limit: 10 });
      if (res?.code === 200) {
        hotSingerList.value = res?.artists.slice(0, 10);
      } else {
        hotSingerList.value = [];
      }
    } catch {
      hotSingerList.value = [];
    }
  };
  //#endregion
  //#region 新碟
  /**
   * 19723756 飙升
   * 3779629 新歌
   * 3778678 热歌
   * 2809513713 欧美
   * 745956260 韩语
   */
  const getSomeRankList = async () => {
    try {
      const types = [19723756, 3779629, 3778678, 2809513713, 745956260];
      const promiseArr = types.map((item) => {
        return portalService.getRankDetailById({ id: item });
      });
      const resArr = await Promise.all(promiseArr);
      if (resArr?.length) {
        surgeRankVO.value = {
          ...resArr[0].playlist,
          tracks: resArr[0].playlist?.tracks.splice(0, 5),
        };
        newMusicRankVO.value = {
          ...resArr[1].playlist,
          tracks: resArr[1].playlist?.tracks.splice(0, 5),
        };
        hotMusicRankVO.value = {
          ...resArr[2].playlist,
          tracks: resArr[2].playlist?.tracks.splice(0, 5),
        };
        eaMusicRankVO.value = {
          ...resArr[3].playlist,
          tracks: resArr[3].playlist?.tracks.splice(0, 5),
        };
        krjpMusicRankVO.value = {
          ...resArr[4].playlist,
          tracks: resArr[4].playlist?.tracks.splice(0, 5),
        };
      } else {
        surgeRankVO.value = null;
        newMusicRankVO.value = null;
        hotMusicRankVO.value = null;
        eaMusicRankVO.value = null;
        krjpMusicRankVO.value = null;
      }
    } catch {
      surgeRankVO.value = null;
      newMusicRankVO.value = null;
      hotMusicRankVO.value = null;
      eaMusicRankVO.value = null;
      krjpMusicRankVO.value = null;
    }
  };
  //#endregion
  //#region 首页推荐流取数
  // 区块瀑布流
  const queryBlockPage = async () => {
    try {
      const res = await portalService.getHomepageBlockPage({ refresh: false });
      if (res?.code === 200 && res?.data?.blocks?.length) {
        blockPageList.value = res.data.blocks;
        blockPageError.value = false;
      } else {
        blockPageList.value = [];
        blockPageError.value = true;
      }
    } catch {
      blockPageList.value = [];
      blockPageError.value = true;
    }
  };
  // 金刚区
  const queryDragonBall = async () => {
    try {
      const res = await portalService.getHomepageDragonBall();
      const list = res?.data?.ballList || res?.ballList || [];
      dragonBallList.value = list;
    } catch {
      dragonBallList.value = [];
    }
  };
  // 推荐歌单
  const queryPersonalized = async (limit = 10) => {
    try {
      const res = await portalService.getPersonalized({ limit });
      personalizedList.value = res?.result?.slice(0, limit) || [];
    } catch {
      personalizedList.value = [];
    }
  };
  // 推荐新歌
  const queryNewSong = async (limit = 10) => {
    try {
      const res = await portalService.getPersonalizedNewSong({ limit });
      newSongList.value = res?.result?.slice(0, limit) || [];
    } catch {
      newSongList.value = [];
    }
  };
  // 推荐电台(播客)
  const queryDjProgram = async () => {
    try {
      const res = await portalService.getPersonalizedDjProgram();
      djProgramList.value = res?.result?.slice(0, 6) || [];
    } catch {
      djProgramList.value = [];
    }
  };
  // 推荐 MV
  const queryPersonalizedMv = async () => {
    try {
      const res = await portalService.getPersonalizedMv();
      personalizedMvList.value = res?.result?.slice(0, 6) || [];
    } catch {
      personalizedMvList.value = [];
    }
  };
  // 独家放送
  const queryPrivateContent = async () => {
    try {
      const res = await portalService.getPersonalizedPrivatecontent();
      privateContentList.value = res?.result?.slice(0, 6) || [];
    } catch {
      privateContentList.value = [];
    }
  };
  // 每日推荐歌单
  const queryRecommendResource = async () => {
    try {
      const res = await portalService.getRecommendResource();
      recommendResourceList.value = res?.recommend?.slice(0, 10) || [];
    } catch {
      recommendResourceList.value = [];
    }
  };
  // 每日推荐歌曲
  const queryRecommendSongs = async () => {
    try {
      const res = await portalService.getRecommendSongs();
      recommendSongList.value = res?.data?.dailySongs || [];
    } catch {
      recommendSongList.value = [];
    }
  };
  // 所有榜单
  const queryToplist = async () => {
    try {
      const res = await portalService.getToplist();
      toplist.value = res?.list || [];
      // 默认选中第一个官方榜单
      if (!selectedRankId.value && toplist.value.length) {
        selectedRankId.value = toplist.value[0].id || null;
        if (selectedRankId.value) {
          queryRankDetail(selectedRankId.value);
        }
      }
    } catch {
      toplist.value = [];
    }
  };
  // 单个榜单详情
  const queryRankDetail = async (id: number) => {
    try {
      selectedRankId.value = id;
      const res = await portalService.getTopList({ id });
      rankTrackList.value = res?.playlist?.tracks?.slice(0, 20) || [];
    } catch {
      rankTrackList.value = [];
    }
  };
  // 精品歌单
  const queryTopPlaylistHighquality = async (limit = 10) => {
    try {
      const res = await portalService.getTopPlaylistHighquality({ limit });
      highqualityList.value = res?.playlists?.slice(0, limit) || [];
    } catch {
      highqualityList.value = [];
    }
  };
  // 新歌速递
  const queryTopSong = async (type = 0) => {
    try {
      const res = await portalService.getTopSong({ type });
      topSongList.value = res?.data?.slice(0, 20) || [];
    } catch {
      topSongList.value = [];
    }
  };
  // MV 排行榜
  const queryTopMv = async (limit = 10) => {
    try {
      const res = await portalService.getTopMv({ limit });
      topMvList.value = res?.data?.slice(0, limit) || [];
    } catch {
      topMvList.value = [];
    }
  };
  // 每日推荐-不感兴趣
  const dislikeRecommendSong = async (id: number) => {
    try {
      await portalService.dislikeRecommendSong({ id });
    } catch {
      // 不感兴趣失败不影响列表
    } finally {
      recommendSongList.value = recommendSongList.value.filter((item) => item.id !== id);
    }
  };
  //#endregion
  //#region 推荐流跳转
  const linkToPlaylist = (id?: number | string) => {
    if (id == null) return;
    router.push({ path: '/playlist_detail', query: { id: String(id) } });
  };
  const linkToSong = (id?: number | string) => {
    if (id == null) return;
    router.push({ path: '/music_detail', query: { id: String(id) } });
  };
  const linkToMv = (id?: number | string) => {
    if (id == null) return;
    router.push({ path: '/mvplay', query: { mvid: String(id) } });
  };
  const linkToAlbum = (id?: number | string) => {
    if (id == null) return;
    router.push({ path: '/album_detail', query: { id: String(id) } });
  };
  const linkToDailyRecommend = () => {
    router.push({ path: '/daily_recommend' });
  };
  const linkToRank = () => {
    router.push({ path: '/rank' });
  };
  //#endregion
  //#region
  const linkToAritstDetail = (id: number) => {
    router.push({
      path: '/artist_detail',
      query: {
        id,
      },
    });
  };
  //#endregion

  // reactive 包装：ref 自动解包，svc.xxx 仍是「值」，与旧 getter 行为一致；
  // 原带 setter 的字段（如 selectedRecommendPlayListType）经 reactive 写回仍可赋值
  const state = reactive({
    // 状态字段（对应原 public getter / readonly 字段）
    loading,
    bannerList,
    recommendPlayListNavs, // 推荐歌单类型
    selectedRecommendPlayListType,
    surgeRankVO,
    newMusicRankVO,
    hotMusicRankVO,
    eaMusicRankVO,
    krjpMusicRankVO,
    playList,
    hotSingerList,
    blockPageList,
    blockPageError,
    dragonBallList,
    personalizedList,
    newSongList,
    djProgramList,
    personalizedMvList,
    privateContentList,
    recommendResourceList,
    recommendSongList,
    toplist,
    selectedRankId,
    rankTrackList,
    highqualityList,
    topSongList,
    topMvList,
    // 方法（对应原 public 方法，签名不变）
    init,
    queryBannerLsit,
    handleBannerLinkTo,
    queryPlayListByType,
    queryHotSinger,
    getSomeRankList,
    queryBlockPage,
    queryDragonBall,
    queryPersonalized,
    queryNewSong,
    queryDjProgram,
    queryPersonalizedMv,
    queryPrivateContent,
    queryRecommendResource,
    queryRecommendSongs,
    queryToplist,
    queryRankDetail,
    queryTopPlaylistHighquality,
    queryTopSong,
    queryTopMv,
    dislikeRecommendSong,
    linkToPlaylist,
    linkToSong,
    linkToMv,
    linkToAlbum,
    linkToDailyRecommend,
    linkToRank,
    linkToAritstDetail,
  });
  return state;
};

// 模块级缓存：跨组件共享同一实例（替代原 export default new PortService()）
let shared: ReturnType<typeof create> | null = null;
export const usePortal = () => (shared ??= create());
