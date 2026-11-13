import { computed, reactive, ref } from 'vue';

import { getQueryParam } from '@/core/token';
import { PD_PlaylistDetail } from '../../../../apis/playlist-detail/index.api';
import { MP_MVCommentRes } from '../../../../apis/mvplay/index.api';
import { Common_IMusic } from '../../../../apis/common/index.api';
import { getRequest } from '../../../../apis/request';
import CommonService from '../../../../apis/common/common.service';
import {
  subscribePlaylist,
  getPlaylistDetailDynamic,
  addTrackToPlaylist,
  deleteTrackFromPlaylist,
  getPlaylistTrackAll,
  PM_DynamicRes,
} from '../../../../apis/playlist-manage/index.api';

enum EPath {
  查询歌单详情 = '/playlist/detail',
}

const create = () => {
  // 从地址栏读取歌单 id（一次）。
  const idParam = getQueryParam('id');
  const playlistId = idParam ? Number(idParam) : 0;

  //#region
  const _playListResult = ref<PD_PlaylistDetail>({
    backgroundCoverUrl: '',
    bannedTrackIds: '',
    cloudTrackCount: '',
    commentCount: '',
    commentThreadId: '',
    copied: false,
    coverImgId: '',
    coverImgId_str: '',
    coverImgUrl: '',
    createTime: '',
    description: '',
    englishTitle: '',
    gradeStatus: '',
    highQuality: false,
    historySharedUsers: '',
    id: '',
    name: '',
    newImported: '',
    officialPlaylistType: '',
    opRecommend: '',
    ordered: '',
    playCount: '',
    privacy: '',
    remixVideo: '',
    score: '',
    shareCount: '',
    tags: [],
    titleImage: '',
    titleImageUrl: '',
    trackCount: '',
    tracks: [],
  });

  const _playListCommentResult = ref<MP_MVCommentRes>({
    comments: [],
    hotComments: [],
  });

  const _playListMusicListResult = ref<Common_IMusic[]>([]);

  const _dynamic = ref<PM_DynamicRes>({ code: 0 });

  const _subscribed = ref<boolean>(false);

  /**
   * $ 后缀字段保持为 Ref：computed 包一层后放进 reactive 只解包一层，
   * 组件里 watch(svc.playListResult$, ...) 等订阅拿到的仍是 Ref。
   */
  const playListResult$ = computed(() => _playListResult);
  const playListCommentResult$ = computed(() => _playListCommentResult);
  const playListMusicListResult$ = computed(() => _playListMusicListResult);
  const dynamic$ = computed(() => _dynamic);

  // subscribed 原为可读写 getter/setter，这里用可写 computed 保持读值、写入语义。
  const subscribed = computed({
    get: () => _subscribed.value,
    set: (v: boolean) => {
      _subscribed.value = v;
    },
  });
  //#region
  const _loading = ref<boolean>(true);

  // loading 为普通取值字段，经 reactive 解包后模板拿到布尔值。
  const loading = computed(() => _loading.value);
  //#endregion

  const queryCommentList = async () => {
    const id = Number(getQueryParam('id'));
    const commonService = new CommonService();
    const res = await commonService.getPlayListCommentList(id);
    _playListCommentResult.value = {
      comments: res?.comments ?? [],
      hotComments: res?.hotComments ?? [],
    };
  };

  /**
   * 拉取歌单全部歌曲（playlist_track_all 直接返回歌曲详情）
   */
  const refreshTracks = async () => {
    try {
      const res = await getPlaylistTrackAll({ id: playlistId, limit: 1000 });
      const songs = res?.songs || [];
      _playListMusicListResult.value = songs.map((item: any) => ({
        dt: item.dt,
        url: '',
        name: item.name,
        alName: item.al?.name,
        artist: item.ar?.[0]?.name,
        picUrl: item.al?.picUrl,
        id: item.id,
      }));
    } catch {
      // 失败回退到原逻辑
      try {
        const res = await getRequest(EPath.查询歌单详情, { id: playlistId });
        const ids = res?.playlist?.trackIds?.map((item: any) => item?.id)?.join(',');
        const commonService = new CommonService();
        const songRes = await commonService.getMusicDetailByIds(ids);
        _playListMusicListResult.value = (songRes?.songs || []).map((item) => ({
          dt: item.dt,
          url: '',
          name: item.name,
          alName: item.al?.name ?? '',
          artist: item.ar?.[0]?.name ?? '',
          picUrl: item.al?.picUrl ?? '',
          id: item.id,
        }));
      } catch {
        // 回退接口也失败时，歌曲列表保持为空
      }
    }
  };

  /**
   * 歌单动态数据（播放量/收藏数等）
   */
  const queryDynamic = async () => {
    try {
      const res = await getPlaylistDetailDynamic({ id: playlistId });
      if (res) {
        _dynamic.value = res;
      }
    } catch {
      // 动态数据拉取失败时保留默认值，不阻断页面
    }
  };

  const init = async () => {
    const id = getQueryParam('id');
    _loading.value = true;
    try {
      const res = await getRequest(EPath.查询歌单详情, {
        id,
      });
      _playListResult.value = res?.playlist;

      refreshTracks();

      queryCommentList();
      queryDynamic();
    } catch {
      // 详情拉取失败时保留上一帧数据，仅结束 loading
    } finally {
      _loading.value = false;
    }
  };

  /**
   * 收藏/取消收藏
   * @param t 1 收藏，2 取消
   */
  const subscribe = async (t: number) => {
    const res = await subscribePlaylist({ id: playlistId, t });
    if (res?.code === 200) {
      _subscribed.value = t === 1;
      queryDynamic();
    } else {
      throw new Error('操作失败');
    }
  };

  /**
   * 添加歌曲（ids 逗号分隔）
   */
  const addTrack = async (ids: string) => {
    const res = await addTrackToPlaylist({ pid: playlistId, ids });
    if (res?.code === 200) {
      await refreshTracks();
      await queryDynamic();
    } else {
      throw new Error('添加失败');
    }
  };

  /**
   * 移除歌曲（ids 逗号分隔）
   */
  const removeTrack = async (ids: string) => {
    const res = await deleteTrackFromPlaylist({ id: playlistId, ids });
    if (res?.code === 200) {
      await refreshTracks();
      await queryDynamic();
    } else {
      throw new Error('移除失败');
    }
  };

  // 进入页面即初始化拉取。
  init();

  return reactive({
    playListResult$,
    playListCommentResult$,
    playListMusicListResult$,
    dynamic$,
    subscribed,
    loading,
    init,
    queryCommentList,
    refreshTracks,
    queryDynamic,
    subscribe,
    addTrack,
    removeTrack,
  });
};

/** 歌单详情页状态：每次调用创建新实例，保证切换 id 后重新拉数据 */
export const usePlayListDetail = () => create();
