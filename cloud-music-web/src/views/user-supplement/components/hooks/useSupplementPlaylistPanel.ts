import { computed, onMounted, ref } from 'vue';

import userSupplementService from '../../../../apis/user-supplement/user-supplement.service';
import {
  extractObj,
  pickPlaylistId,
  toList,
  useSupplementGuard,
  useWriteRunner,
  type SupplementCard,
} from '../../use-supplement';

/** 由 .vue 注入父级依赖，避免 hook 直接耦合 defineProps / defineEmits 的编译宏类型 */
export interface SupplementPlaylistPanelOptions {
  hasLogin: () => boolean;
  getUid: () => string;
  setUid: (value: string) => void;
  setToast: (message: string) => void;
}

/**
 * 6.3 歌单编辑面板编排：我的歌单取 id → 9 个 playlist_* 接口。
 * 从 supplement-playlist-panel.vue 抽出，模板只做展示，行为不变。
 */
export function useSupplementPlaylistPanel(options: SupplementPlaylistPanelOptions) {
  /** uid 输入框：读写都走父级，保证跨面板一致 */
  const uidModel = computed({
    get: () => options.getUid(),
    set: (value: string) => options.setUid(value),
  });

  const myPlaylists = ref<SupplementCard[]>([]);
  const playlistId = ref<string>('');
  const playlistName = ref<string>('');
  const playlistDesc = ref<string>('');
  const playlistTags = ref<string>('');
  const tracksOp = ref<string>('add');
  const tracksIds = ref<string>('');
  const orderIds = ref<string>('');
  const privacyVal = ref<string>('0');
  const coverFile = ref<File | null>(null);
  const videoRecentList = ref<SupplementCard[]>([]);
  const writeResult = ref<string>('');

  const { requireLogin, writeGuard } = useSupplementGuard({
    hasLogin: options.hasLogin,
    setToast: options.setToast,
  });
  const runWrite = useWriteRunner(writeResult, writeGuard);

  /** 上游列表来源：/user/playlist（id 来源，不计入接口清单统计） */
  const loadMyPlaylists = async () => {
    if (!requireLogin()) return;
    try {
      const res = await userSupplementService.getMyPlaylists({
        uid: uidModel.value,
        limit: 30,
        offset: 0,
      });
      myPlaylists.value = toList(res);
      options.setToast(`我的歌单已加载 ${myPlaylists.value.length} 个`);
    } catch {
      myPlaylists.value = [];
      options.setToast('接口请求失败，已返回空值');
    }
  };

  /** 点选歌单 → 回填 id，供下方 9 个 playlist_* 接口共用 */
  const onPlaylistClick = (item: SupplementCard) => {
    const id = pickPlaylistId(item.raw) || item.id;
    if (!id) return;
    playlistId.value = String(id);
    options.setToast(`已选择歌单 id=${id}，可用于下方 9 个 playlist_* 接口`);
  };

  /** 6.3 九个 playlist_* 接口真实调用点 */
  const doUpdatePlaylist = () =>
    runWrite('playlist_update 更新歌单', () =>
      userSupplementService.updatePlaylist({
        id: playlistId.value,
        name: playlistName.value,
        desc: playlistDesc.value,
        tags: playlistTags.value,
      }),
    );

  const doPlaylistTracks = () =>
    runWrite('playlist_tracks 歌单歌曲增删', () =>
      userSupplementService.getPlaylistTracks({
        id: playlistId.value,
        pid: playlistId.value,
        op: tracksOp.value,
        tracks: tracksIds.value,
        ids: tracksIds.value,
      }),
    );

  const doUpdatePlaycount = () =>
    runWrite('playlist_update_playcount 更新播放量', () =>
      userSupplementService.updatePlaylistPlaycount({ id: playlistId.value }),
    );

  /** playlist_video_recent：只读调用点 */
  const loadVideoRecent = async () => {
    try {
      const res = await userSupplementService.getPlaylistVideoRecent({ limit: 30 });
      videoRecentList.value = toList(res);
      options.setToast(`最近视频歌单已加载 ${videoRecentList.value.length} 条`);
    } catch {
      videoRecentList.value = [];
      options.setToast('接口请求失败，已返回空值');
    }
  };

  /** playlist_cover_update：写操作 + postFormRequest 上传 */
  const onCoverChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    coverFile.value = input.files?.[0] ?? null;
  };

  const doUpdateCover = async () => {
    const file = coverFile.value;
    if (!file) {
      options.setToast('请先选择封面图片');
      return;
    }
    if (!writeGuard('确定上传并更新歌单封面吗？该操作会向服务端提交文件。')) return;
    try {
      const res = await userSupplementService.updatePlaylistCover(
        Number(playlistId.value) || 0,
        file,
      );
      const obj = extractObj(res);
      writeResult.value = `playlist_cover_update 已提交｜code=${obj.code ?? res?.code ?? '—'}｜${obj.message ?? res?.message ?? '无附加信息'}`;
    } catch {
      writeResult.value = 'playlist_cover_update 请求失败，已按空值处理';
    }
  };

  const doUpdateDesc = () =>
    runWrite('playlist_desc_update 更新描述', () =>
      userSupplementService.updatePlaylistDesc({ id: playlistId.value, desc: playlistDesc.value }),
    );

  const doUpdateTags = () =>
    runWrite('playlist_tags_update 更新标签', () =>
      userSupplementService.updatePlaylistTags({ id: playlistId.value, tags: playlistTags.value }),
    );

  const doUpdateOrder = () =>
    runWrite('playlist_order_update 调整顺序', () =>
      userSupplementService.updatePlaylistOrder({ ids: orderIds.value }),
    );

  const doUpdatePrivacy = () =>
    runWrite('playlist_privacy 设置隐私', () =>
      userSupplementService.updatePlaylistPrivacy({
        id: playlistId.value,
        privacy: privacyVal.value,
      }),
    );

  /** 进面板先拉一次我的歌单，便于直接点选 id */
  onMounted(loadMyPlaylists);

  return {
    uidModel,
    myPlaylists,
    playlistId,
    playlistName,
    playlistDesc,
    playlistTags,
    tracksOp,
    tracksIds,
    orderIds,
    privacyVal,
    videoRecentList,
    writeResult,
    loadMyPlaylists,
    onPlaylistClick,
    doUpdatePlaylist,
    doPlaylistTracks,
    doUpdatePlaycount,
    loadVideoRecent,
    onCoverChange,
    doUpdateCover,
    doUpdateDesc,
    doUpdateTags,
    doUpdateOrder,
    doUpdatePrivacy,
  };
}
