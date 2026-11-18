import { defineStore } from 'pinia';
import { computed, nextTick, ref, shallowRef } from 'vue';
import { Common_IMusic } from '@/apis/common/index.api';
import { PL_PlayVO } from '@/apis/play-list/index.api';
import musicService from '@/apis/play-controller/pc.service';
import playInteractionService from '@/apis/play-interaction/play-interaction.service';
import message from '@/utils/message';
import { sessionManager } from '@/core/session';
import { usePlaylistStore } from './playlist';
import { useLyricStore } from './lyric';
import { emptyMusic, PlayType, playTypes, playTypeKeys } from '@/constant';

/** 持久化 key：早期版本存纯数字索引，现存 { currentIndex, playTimestamp, playbackRate } */
const playStorageKey = 'cloud-play-index';

/** 支持的播放倍速，切换时循环 */
const playbackRates = [0.75, 1, 1.25, 1.5, 2] as const;
type PlaybackRate = (typeof playbackRates)[number];

export const usePlayerStore = defineStore(
  'player',
  () => {
    const playlist = usePlaylistStore();
    const lyric = useLyricStore();

    // <audio> 由 PlayController 组件注入；shallowRef 避免 DOM 被深层代理
    const audioEl = shallowRef<HTMLAudioElement | null>(null);
    const currentIndex = ref(0);
    const isPlaying = ref(false);
    const playTypeIndex = ref(0);
    const playTimestamp = ref(0);
    const progress = ref(0);
    const dragging = ref(false);
    const isMute = ref(false);
    const volume = ref(50);
    const playbackRate = ref<PlaybackRate>(1);
    /** 已红心歌曲 id 集合：由 /likelist 加载，供播放条收藏按钮回显 */
    const likedIds = ref<number[]>([]);
    const errorList = ref<number[]>([]);
    /** 歌词按歌曲缓存：避免暂停→恢复、单曲循环重复请求 /lyric 并 reset 导致歌词闪烁 */
    const lyricRawCache = new Map<number, string>();
    let lyricLoadedId = 0;
    /** 首次 startPlayback 用持久化进度续听，之后切歌/循环都从头 */
    let restoreTimestampPending = true;

    /** 当前歌曲从队列派生，不再额外维护一份副本 */
    const currentMusic = computed<Common_IMusic>(
      () => playlist.musicList[currentIndex.value] ?? emptyMusic,
    );
    /** 组件挂载后注入音频元素，并同步音量 / 静音态 */
    const bindAudio = (el: HTMLAudioElement | null) => {
      audioEl.value = el;
      if (el) {
        el.volume = volume.value / 100;
        el.muted = isMute.value;
        el.playbackRate = playbackRate.value;
      }
    };

    /** 把补拉到的音源写回当前队列项，触发 <audio> 重新加载 */
    const setCurrentUrl = (url: string) => {
      const item = playlist.musicList[currentIndex.value];
      if (item) item.url = url;
    };

    /** 真正驱动 <audio> 播放 */
    const startPlayback = async (resetFlag = true) => {
      const el = audioEl.value;
      if (!el) {
        return;
      }
      // 初始化/还原后 url 可能为空或已失效，先补拉一次音源再决定是否可播，
      // 避免直接拿持久化的空/过期 url 当 src 触发 <audio> @error 弹「播放失败」
      let url = currentMusic.value.url;
      if (!url) {
        url = await playlist.queryMusicUrl(String(currentMusic.value.id));
        if (url) setCurrentUrl(url);
      }
      const noPlayableUrl =
        !url ||
        (playlist.musicList.length > 0 && errorList.value.length === playlist.musicList.length);
      if (noPlayableUrl) {
        // 无可用音源：仅停止播放并提示，不要递归 onEnded。
        // 原逻辑在此调用 onEnded → switchMusic → nextTick(startPlayback)，
        // 当 url 为空时会形成无限微任务循环，饿死事件循环导致页面卡死。
        isPlaying.value = false;
        el.pause();
        if (!url) {
          message.error('当前歌曲暂无可用音源');
        }
        return;
      }
      if (resetFlag) {
        // 首次播放还原上次进度；其余换歌场景一律从头
        const resumeMs = restoreTimestampPending ? playTimestamp.value : 0;
        restoreTimestampPending = false;
        const maxMs = currentMusic.value.dt || resumeMs;
        el.currentTime = Math.max(0, Math.min(resumeMs, maxMs)) / 1000;
      }
      document.title = currentMusic.value.name || '云音乐';
      el.play().catch(() => undefined);
      errorList.value = errorList.value.filter((id) => id === currentMusic.value.id);
      isPlaying.value = true;
      getSongLyric();
    };

    /** 播放指定歌曲：入队 → 定位索引 → 启动播放 */
    const play = async (song: Common_IMusic) => {
      if (!song) {
        return;
      }
      const item: PL_PlayVO = {
        artist: song.artist,
        dt: song.dt,
        url: '',
        alName: song.alName ?? '',
        name: song.name,
        picUrl: song.picUrl,
        id: song.id,
      };
      const index = await playlist.addMusic(item);
      lyric.reset();
      // play 同一首歌时 id 不变，需作废已加载标记，让歌词从缓存重新 parse
      lyricLoadedId = 0;
      playTimestamp.value = 0;
      currentIndex.value = index;
      isPlaying.value = true;
      await startPlayback();
    };

    /** 播放结束 / 点击上一首下一首：按当前播放模式决定行为 */
    const onEnded = (direction: 'next' | 'preview' = 'next') => {
      const list = playlist.musicList;
      if (!list.length) {
        return;
      }
      const type = playTypeKeys[playTypeIndex.value % playTypeKeys.length];
      switch (type) {
        case PlayType.LOOP:
          switchMusic(direction);
          break;
        case PlayType.SINGLE:
          playTimestamp.value = 0;
          nextTick(() => startPlayback());
          isPlaying.value = true;
          break;
        case PlayType.RANDOM:
          currentIndex.value = Math.min(
            Math.round(Math.random() * list.length),
            list.length - 1,
          );
          nextTick(() => startPlayback());
          isPlaying.value = true;
          break;
        default:
          break;
      }
    };

    /** 切换上一首 / 下一首（队列首尾循环） */
    const switchMusic = (type: 'preview' | 'next') => {
      const len = playlist.musicList.length;
      if (!len) {
        return;
      }
      isPlaying.value = false;
      playTimestamp.value = 0;
      currentIndex.value =
        type === 'preview'
          ? (currentIndex.value - 1 + len) % len
          : (currentIndex.value + 1) % len;
      nextTick(() => startPlayback());
    };

    const switchPlayType = () => {
      playTypeIndex.value += 1;
    };

    /** 循环切换倍速并同步到当前音频元素 */
    const switchPlaybackRate = () => {
      const index = playbackRates.indexOf(playbackRate.value);
      playbackRate.value = playbackRates[(index + 1) % playbackRates.length];
      if (audioEl.value) {
        audioEl.value.playbackRate = playbackRate.value;
      }
    };

    const switchPlayStatus = () => {
      if (!playlist.musicList.length) {
        return;
      }
      isPlaying.value = !isPlaying.value;
      if (isPlaying.value) {
        startPlayback(false);
      } else {
        audioEl.value?.pause();
      }
    };

    /** <audio> timeupdate：刷新进度并推进歌词 */
    const onTimeUpdate = () => {
      const el = audioEl.value;
      // 拖动中进度由滑块 v-model 驱动，不能用音频时间回写，否则滑块被拽回原位
      if (!el || dragging.value) {
        return;
      }
      playTimestamp.value = el.currentTime * 1000;
      progress.value = Number(
        Math.round((100 * playTimestamp.value) / (currentMusic.value.dt || 1)),
      );
      lyric.syncPanel(playTimestamp.value);
    };

    /** 进度条释放（el-slider @change）：按滑块 progress（0~100）写回音频；播放中则续播 */
    const seek = () => {
      dragging.value = false;
      const dt = currentMusic.value.dt || 0;
      if (audioEl.value && dt) {
        audioEl.value.currentTime = (progress.value / 100) * (dt / 1000);
        // 在播放中拖动：释放后必须显式续播。不能依赖 endDragging（mouseup 可能落在滑块外）
        if (isPlaying.value) {
          audioEl.value.play().catch(() => undefined);
        }
      }
    };

    /** 拖住滑块：暂停时间回写即可，不 pause 音频——避免 mouseup 丢失导致永久暂停 */
    const startDragging = () => {
      if (!playlist.musicList.length) {
        return;
      }
      dragging.value = true;
    };

    /** 跳转到指定毫秒位置（用于点击歌词行） */
    const seekTo = (timeMs: number) => {
      const el = audioEl.value;
      const dt = currentMusic.value.dt || 0;
      if (!el || !dt) {
        return;
      }
      el.currentTime = Math.max(0, Math.min(timeMs, dt)) / 1000;
      playTimestamp.value = timeMs;
      progress.value = Math.min(
        100,
        Math.round((timeMs / dt) * 100),
      );
      lyric.syncPanel(timeMs);
    };

    /** pointerup / pointercancel 兜底：仅清拖动标记，播放态由 seek 决定 */
    const endDragging = () => {
      if (!playlist.musicList.length) {
        return;
      }
      if (dragging.value) {
        dragging.value = false;
        playTimestamp.value = currentMusic.value.dt * (progress.value / 100);
      }
    };

    /** 音量滑块 change：应用到音频元素；静音态下拖音量自动解除静音 */
    const setVolume = () => {
      dragging.value = false;
      if (audioEl.value) {
        audioEl.value.volume = volume.value / 100;
      }
      if (isMute.value && volume.value > 0) {
        isMute.value = false;
        if (audioEl.value) {
          audioEl.value.muted = false;
        }
      }
    };

    const switchIsMute = () => {
      isMute.value = !isMute.value;
      if (audioEl.value) {
        audioEl.value.muted = isMute.value;
      }
    };

    /** 快捷键调音量：按步进增减，静音态下加音量自动解除静音 */
    const adjustVolume = (delta: number) => {
      volume.value = Math.min(100, Math.max(0, volume.value + delta));
      if (audioEl.value) {
        audioEl.value.volume = volume.value / 100;
      }
      if (isMute.value && volume.value > 0) {
        isMute.value = false;
        if (audioEl.value) {
          audioEl.value.muted = false;
        }
      }
    };

    const onError = () => {
      if (
        playlist.musicList.length > 0 &&
        errorList.value.length === playlist.musicList.length
      ) {
        isPlaying.value = false;
        audioEl.value?.pause();
        return;
      }
      if (!errorList.value.includes(currentMusic.value.id)) {
        message.error('播放失败');
        lyric.reset();
        // 播放失败清空歌词后，允许同歌重试时从缓存恢复
        lyricLoadedId = 0;
        errorList.value.push(currentMusic.value.id);
        isPlaying.value = false;
        audioEl.value?.pause();
      }
    };

    /** 拉取并解析当前歌曲歌词：同一首歌只拉一次，切歌/失败后可重试 */
    const getSongLyric = async () => {
      const id = currentMusic.value.id;
      if (!id || lyricLoadedId === id) {
        return;
      }
      const cached = lyricRawCache.get(id);
      if (cached !== undefined) {
        lyric.parse(cached);
        lyricLoadedId = id;
        return;
      }
      try {
        const res = await musicService.getLyricById({ id });
        // 请求期间已切歌：丢弃过期响应，避免旧歌歌词覆盖当前歌词
        if (currentMusic.value.id !== id) {
          return;
        }
        const raw = res?.lrc?.lyric ?? '';
        lyricRawCache.set(id, raw);
        lyric.parse(raw);
        lyricLoadedId = id;
      } catch {
        // 失败不写缓存、不标记，下次仍可重试
        lyric.reset();
      }
    };

    /** 加载我喜欢的歌曲 id，供播放条收藏状态回显；未登录直接跳过 */
    const loadLikedIds = async () => {
      if (!sessionManager.isAlive()) {
        likedIds.value = [];
        return;
      }
      const res = await playInteractionService.getLikelist();
      const raw = (res as { data?: unknown; ids?: unknown } | null)?.ids
        ?? (res as { data?: unknown } | null)?.data;
      likedIds.value = Array.isArray(raw) ? raw.map(Number).filter((id) => Number.isFinite(id)) : [];
    };

    /** 播放条红心：未登录提示、二次确认、成功后回写本地集合 */
    const toggleLike = () => {
      if (!sessionManager.isAlive()) {
        message.info('请先登录后再收藏歌曲');
        return;
      }
      const id = currentMusic.value.id;
      if (!id) {
        return;
      }
      const liked = likedIds.value.includes(id);
      const action = liked ? '取消收藏' : '收藏';
      if (!window.confirm(`确认${action}「${currentMusic.value.name || '当前歌曲'}」？`)) {
        return;
      }
      void playInteractionService.setLike({ id, t: liked ? 0 : 1 }).then((res) => {
        const code = (res as { code?: number } | null)?.code;
        if (code !== undefined && code !== 200) {
          message.error(`${action}失败，请稍后重试`);
          return;
        }
        likedIds.value = liked
          ? likedIds.value.filter((item) => item !== id)
          : [...likedIds.value, id];
        message.success(`${action}成功`);
      });
    };

    const downloadMusic = async () => {
      try {
        const res = await musicService.getSongDownloadUrl({ id: currentMusic.value.id });
        if (res?.data?.url) {
          const link = document.createElement('a');
          link.href = res.data.url;
          link.click();
        } else {
          message.error('当前歌曲不可下载！');
        }
      } catch {
        message.error('服务异常！');
      }
    };

    return {
      audioEl,
      currentIndex,
      isPlaying,
      playTypeIndex,
      playTimestamp,
      progress,
      dragging,
      isMute,
      volume,
      playbackRate,
      playbackRates,
      likedIds,
      errorList,
      currentMusic,
      playTypes,
      bindAudio,
      play,
      onEnded,
      switchMusic,
      switchPlayType,
      switchPlaybackRate,
      switchPlayStatus,
      onTimeUpdate,
      seek,
      startDragging,
      endDragging,
      seekTo,
      setVolume,
      switchIsMute,
      adjustVolume,
      onError,
      getSongLyric,
      loadLikedIds,
      toggleLike,
      downloadMusic,
    };
  },
  {
    persist: {
      key: playStorageKey,
      storage: localStorage,
      pick: ['currentIndex', 'playTimestamp', 'playbackRate'],
      // 兼容旧格式：早期值是纯数字字符串（如 "3"），现为 JSON 对象
      serializer: {
        serialize: (data) => JSON.stringify({
          currentIndex: data.currentIndex ?? 0,
          playTimestamp: data.playTimestamp ?? 0,
          playbackRate: data.playbackRate ?? 1,
        }),
        deserialize: (raw) => {
          const trimmed = String(raw ?? '').trim();
          if (!trimmed) return { currentIndex: 0, playTimestamp: 0, playbackRate: 1 };
          // 旧格式：纯数字索引
          if (/^-?\d+$/.test(trimmed)) {
            return { currentIndex: Number(trimmed) || 0, playTimestamp: 0, playbackRate: 1 };
          }
          try {
            const parsed = JSON.parse(trimmed) as Partial<{
              currentIndex: number;
              playTimestamp: number;
              playbackRate: number;
            }>;
            return {
              currentIndex: Number(parsed.currentIndex) || 0,
              playTimestamp: Number(parsed.playTimestamp) || 0,
              // 非法倍速值回退到 1，避免 audio.playbackRate 抛异常
              playbackRate: (playbackRates as readonly number[]).includes(Number(parsed.playbackRate))
                ? Number(parsed.playbackRate)
                : 1,
            };
          } catch {
            return { currentIndex: 0, playTimestamp: 0, playbackRate: 1 };
          }
        },
      },
    },
  },
);
