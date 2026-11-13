import { ref, watch } from 'vue';

import { usePlayListDetail } from './usePlayListDetail';
import { PD_PlaylistDetail } from '../../../../apis/playlist-detail/index.api';
import { Common_IMusic } from '../../../../apis/common/index.api';
import { MP_MVCommentRes } from '../../../../apis/mvplay/index.api';
import message from '@/utils/message';

/** 每次返回新对象，避免 tags/tracks 等数组在多个组件实例间共享引用 */
const createEmptyDetail = (): PD_PlaylistDetail => ({
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

/**
 * 歌单详情页编排：订阅服务层数据流 → 本地视图状态，以及订阅/增删歌曲/弹窗交互。
 * 歌单详情页：订阅、歌曲增删、编辑弹窗与统计格式化编排。
 */
export const usePlaylistDetailView = () => {
  const playListDetailService = usePlayListDetail();

  const playlistId = Number(new URLSearchParams(window.location.search).get('id') || '0');

  const playListDetail = ref<PD_PlaylistDetail>(createEmptyDetail());
  const musicList = ref<Common_IMusic[]>([]);
  const commentRes = ref<MP_MVCommentRes>({
    comments: [],
    hotComments: [],
  });
  const dynamic = ref<any>(null);

  const addVisible = ref(false);
  const addSongIds = ref('');
  const adding = ref(false);
  const editVisible = ref(false);

  // 订阅歌单详情 / 评论 / 歌曲列表 / 动态，immediate 保证首屏同步到当前值
  watch(playListDetailService.playListResult$, (v) => (playListDetail.value = v), { immediate: true });
  watch(playListDetailService.playListCommentResult$, (v) => (commentRes.value = v), { immediate: true });
  watch(
    playListDetailService.playListMusicListResult$,
    (v) => {
      musicList.value = v?.map((item) => {
        return {
          dt: item.dt,
          url: '',
          name: item.name,
          alName: item.alName,
          artist: item.artist,
          picUrl: item.picUrl,
          id: item.id,
        };
      });
    },
    { immediate: true },
  );
  watch(playListDetailService.dynamic$, (v) => (dynamic.value = v), { immediate: true });

  const onToggleSubscribe = async () => {
    try {
      await playListDetailService.subscribe(playListDetailService.subscribed ? 2 : 1);
      message.success(playListDetailService.subscribed ? '收藏成功' : '已取消收藏');
    } catch {
      message.error('操作失败，请确认已登录');
    }
  };

  const onRemove = async (item: Common_IMusic) => {
    try {
      await playListDetailService.removeTrack(String(item.id));
      message.success('已移除');
    } catch {
      message.error('移除失败，请确认已登录');
    }
  };

  const onAddSong = async () => {
    const ids = addSongIds.value.trim();
    if (!ids) {
      message.error('请输入歌曲 ID');
      return;
    }
    adding.value = true;
    try {
      await playListDetailService.addTrack(ids);
      message.success('添加成功');
      addVisible.value = false;
      addSongIds.value = '';
    } catch {
      message.error('添加失败，请确认已登录');
    } finally {
      adding.value = false;
    }
  };

  /** 添加歌曲弹窗显隐（模板用 setter，避免直接给解构出的 ref 赋值） */
  const setAddVisible = (visible: boolean) => {
    addVisible.value = visible;
  };

  const openEdit = () => {
    editVisible.value = true;
  };

  const onEdited = () => {
    playListDetailService.init();
  };

  const formatStat = (val?: number) => {
    if (val == null) return '0';
    if (val >= 10000) {
      return `${(val / 10000).toFixed(1)}万`;
    }
    return String(val);
  };

  return {
    playListDetailService,
    playlistId,
    playListDetail,
    musicList,
    commentRes,
    dynamic,
    addVisible,
    addSongIds,
    adding,
    editVisible,
    setAddVisible,
    onToggleSubscribe,
    onRemove,
    onAddSong,
    openEdit,
    onEdited,
    formatStat,
  };
}
