// 歌手详情服务
import { getQueryParam } from '@/core/token';
import artistDetailService from '../../../../apis/artist-detail/ad.service';

import { ArtistVO, AlbumVO, MvVO, DescRes } from '../../../../apis/artist-detail/artist-detail-api';
import { Common_IMusic } from '@/apis/common/index.api';
import { ref, reactive, type Ref } from 'vue';
import contentEnhanceService, { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import {
  ArtistFollowCountRes,
  ContentSongItem,
  ContentVideoItem,
} from '@/apis/content-enhance/index.api';

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
  {
    code: '4',
    name: '视频',
  },
];

// 歌手详情状态层：以 composable 形式组织，内部用 ref + const 箭头函数
const create = () => {
  //#region 状态
  const id = ref(0); // 歌手 id
  const artistVO = ref<ArtistVO>() as Ref<ArtistVO>; // 歌手详情：保持旧 getter 的返回类型 ArtistVO
  const loading = ref<boolean>(false);
  const is_error = ref<boolean>(false);
  const songs = ref<Common_IMusic[]>([]);
  const selectedCode = ref<string>(navs[0].code);
  const albumList = ref<AlbumVO[]>([]);
  const mvList = ref<MvVO[]>([]);
  const itemLoading = ref<boolean>(false);
  const desc = ref<DescRes>({
    briefDesc: '',
    code: 0,
    count: 0,
    introduction: [],
    topicData: [],
  });
  const followCount = ref<ArtistFollowCountRes>({});
  const fans = ref<{ userId?: number; nickname?: string; avatarUrl?: string }[]>([]);
  const topSongs = ref<ContentSongItem[]>([]);
  const allSongs = ref<ContentSongItem[]>([]);
  const songSource = ref<'top' | 'all'>('top');
  const songOrder = ref<'hot' | 'time'>('hot');
  const videos = ref<ContentVideoItem[]>([]);
  const subLoading = ref<boolean>(false);
  const actionTip = ref<string>('');
  //#endregion
  //#region 初始化：拉取歌手详情与热门歌曲，并加载增强数据
  const init = async () => {
    id.value = Number(getQueryParam('id'));
    loading.value = true;
    is_error.value = false;
    try {
      const res = await artistDetailService.getArtistDetail({
        id: id.value,
      });
      if (res) {
        artistVO.value = res;
        songs.value = res?.hotSongs?.map((item) => {
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
    } catch {
      is_error.value = true;
    } finally {
      loading.value = false;
    }
    // 歌手增强：粉丝数、粉丝列表、热门 50 首（参数 id ← /artist_detail?id=，上游为歌手列表）
    queryFollowCount();
    queryFans();
    queryTopSongs();
  };
  //#endregion
  //#region
  const handleNavChange = () => {
    switch (selectedCode.value) {
      case '1':
        queryArtistAlbum();
        break;
      case '2':
        queryArtistMV();
        break;
      case '3':
        queryArtistDesc();
        break;
      case '4':
        queryVideos();
        break;
    }
  };
  //#endregion
  //#region
  const queryArtistAlbum = async () => {
    if (albumList.value?.length) {
      return;
    }
    is_error.value = false;
    itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistAlbumList({
        id: id.value,
      });
      if (res?.hotAlbums?.length) {
        albumList.value = res?.hotAlbums;
      } else {
        albumList.value = [];
      }
    } catch {
      albumList.value = [];
      is_error.value = true;
    } finally {
      setTimeout(() => {
        itemLoading.value = false;
      }, 300);
    }
  };
  //#endregion
  //#region
  const queryArtistMV = async () => {
    if (mvList.value?.length) {
      return;
    }
    is_error.value = false;
    itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistMVList({
        id: id.value,
      });
      if (res?.mvs?.length) {
        mvList.value = res?.mvs;
      } else {
        mvList.value = [];
      }
    } catch {
      mvList.value = [];
      is_error.value = true;
    } finally {
      setTimeout(() => {
        itemLoading.value = false;
      }, 300);
    }
  };
  //#endregion
  //#region
  const queryArtistDesc = async () => {
    if (desc.value?.briefDesc) {
      return;
    }
    is_error.value = false;
    itemLoading.value = true;
    try {
      const res = await artistDetailService.getArtistDesc({
        id: id.value,
      });
      if (res?.code === 200) {
        desc.value = res;
      } else {
        desc.value = {
          briefDesc: '',
          code: 0,
          count: 0,
          introduction: [],
          topicData: [],
        };
      }
    } catch {
      is_error.value = true;
      desc.value = {
        briefDesc: '',
        code: 0,
        count: 0,
        introduction: [],
        topicData: [],
      };
    } finally {
      itemLoading.value = false;
    }
  };
  //#endregion
  //#region P1 歌手增强（1.3 / 1.4）
  /** 粉丝数与关注状态：artist_follow_count */
  const queryFollowCount = async () => {
    if (!id.value) return;
    try {
      const res = await contentEnhanceService.getArtistFollowCount({ id: id.value });
      if (res?.code === 200) followCount.value = res;
    } catch {
      followCount.value = {};
    }
  };

  /** 粉丝列表：artist_fans */
  const queryFans = async () => {
    if (!id.value) return;
    try {
      const res = await contentEnhanceService.getArtistFans({ id: id.value, limit: 10 });
      fans.value = (res?.data || []).map((item) => item.userProfile || {});
    } catch {
      fans.value = [];
    }
  };

  /** 歌手热门 50 首：artist_top_song */
  const queryTopSongs = async () => {
    if (!id.value) return;
    try {
      const res = await contentEnhanceService.getArtistTopSong({ id: id.value });
      topSongs.value = res?.songs || [];
    } catch {
      topSongs.value = [];
    }
  };

  /** 歌手全部歌曲：artist_songs，order hot/time */
  const queryAllSongs = async (order: 'hot' | 'time' = 'hot') => {
    if (!id.value) return;
    songOrder.value = order;
    try {
      const res = await contentEnhanceService.getArtistSongs({ id: id.value, order, limit: 30 });
      allSongs.value = res?.songs || [];
    } catch {
      allSongs.value = [];
    }
  };

  /** 歌手相关视频：artist_video */
  const queryVideos = async () => {
    if (!id.value) return;
    itemLoading.value = true;
    try {
      const res = await contentEnhanceService.getArtistVideo({ id: id.value, size: 10 });
      videos.value = res?.data?.records || res?.data?.feeds || [];
    } catch {
      videos.value = [];
    } finally {
      itemLoading.value = false;
    }
  };

  /** 单曲 tab 数据源切换：热门 50 / 全部歌曲 */
  const switchSongSource = (source: 'top' | 'all') => {
    songSource.value = source;
    if (source === 'all' && !allSongs.value.length) {
      queryAllSongs(songOrder.value);
    }
  };

  const switchSongOrder = (order: 'hot' | 'time') => {
    queryAllSongs(order);
  };

  /** 关注/取消关注歌手：artist_sub（需登录，成功后刷新粉丝数与状态） */
  const toggleSub = async () => {
    if (!hasLogin()) {
      actionTip.value = '登录后可关注歌手';
      return;
    }
    if (!id.value || subLoading.value) return;
    const followed = followCount.value?.data?.isFollow;
    const t = followed ? 0 : 1;
    subLoading.value = true;
    actionTip.value = '';
    try {
      const res = await contentEnhanceService.setArtistSub({ id: id.value, t: t as 1 | 0 });
      if (res?.code === 200) {
        actionTip.value = t === 1 ? '已关注该歌手' : '已取消关注';
        await queryFollowCount();
      } else {
        actionTip.value = res?.message || '操作未成功，请重试';
      }
    } catch {
      actionTip.value = '关注失败，请检查登录态';
    } finally {
      subLoading.value = false;
    }
  };

  const formatSongArtists = (song: ContentSongItem): string => {
    return (song.ar || song.artists || []).map((artist) => artist.name || '').join(' / ');
  };
  //#endregion

  // reactive 包装：ref 自动解包，svc.xxx 仍是「值」，与旧 getter 行为一致；
  // 原带 setter 的字段（selectedCode）经 reactive 写回仍可赋值
  const state = reactive({
    // 状态字段（对应原 public getter / readonly 字段）
    id,
    artistVO,
    songs,
    loading,
    is_error,
    selectedCode,
    albumList,
    mvList,
    itemLoading,
    desc,
    followCount,
    fans,
    topSongs,
    allSongs,
    songSource,
    songOrder,
    videos,
    subLoading,
    actionTip,
    navs,
    pageSize: 20,
    // 方法（对应原 public 方法，签名不变）
    init,
    handleNavChange,
    queryArtistAlbum,
    queryArtistMV,
    queryArtistDesc,
    queryFollowCount,
    queryFans,
    queryTopSongs,
    queryAllSongs,
    queryVideos,
    switchSongSource,
    switchSongOrder,
    toggleSub,
    formatSongArtists,
  });
  return state;
};

/** 歌手详情页状态：每次调用创建新实例，保证切换歌手 id 后重新初始化 */
export const useArtistDetail = () => create();
