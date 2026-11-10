import { defineStore } from 'pinia';
import { computed, nextTick, ref, shallowRef } from 'vue';
import { Common_IMusic } from '@/services/common-api/common-api';
import { PL_IPlayVO } from '@/views/home/components/play-list/play-list.api';
import musicService from '@/views/home/components/play-controller/pc.service';
import message from '@/utils/message';
import { usePlaylistStore } from './playlist';
import { useLyricStore } from './lyric';
import { EMPTY_MUSIC, PLAY_TYPE, PLAY_TYPES, PLAY_TYPE_KEYS } from './constants';

/** 旧版本把当前索引以纯数字字符串写在这个 key 下 */
const INDEX_STORAGE_KEY = 'cloud-play-index';

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
    const errorList = ref<number[]>([]);

    /** 当前歌曲从队列派生，不再额外维护一份副本 */
    const currentMusic = computed<Common_IMusic>(
      () => playlist.musicList[currentIndex.value] ?? EMPTY_MUSIC,
    );
    const playTypes = PLAY_TYPES;

    /** 组件挂载后注入音频元素，并同步音量 / 静音态 */
    const bindAudio = (el: HTMLAudioElement | null) => {
      audioEl.value = el;
      if (el) {
        el.volume = volume.value / 100;
        el.muted = isMute.value;
      }
    };

    /** 真正驱动 <audio> 播放 */
    const startPlayback = (resetFlag = true) => {
      const el = audioEl.value;
      if (!el) {
        return;
      }
      const noPlayableUrl =
        !currentMusic.value.url ||
        (playlist.musicList.length > 0 && errorList.value.length === playlist.musicList.length);
      if (noPlayableUrl) {
        errorList.value = errorList.value.filter((id) => id === currentMusic.value.id);
        onEnded();
        return;
      }
      if (resetFlag) {
        el.currentTime = 0;
      }
      document.title = currentMusic.value.name || '网抑云Music';
      el.play();
      errorList.value = errorList.value.filter((id) => id === currentMusic.value.id);
      isPlaying.value = true;
      getSongLyric();
    };

    /** 播放指定歌曲：入队 → 定位索引 → 启动播放 */
    const play = async (song: Common_IMusic) => {
      if (!song) {
        return;
      }
      const item: PL_IPlayVO = {
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
      playTimestamp.value = 0;
      currentIndex.value = index;
      nextTick(() => startPlayback());
      isPlaying.value = true;
    };

    /** 播放结束 / 点击上一首下一首：按当前播放模式决定行为 */
    const onEnded = (direction: 'next' | 'preview' = 'next') => {
      const list = playlist.musicList;
      if (!list.length) {
        return;
      }
      const type = PLAY_TYPE_KEYS[playTypeIndex.value % PLAY_TYPE_KEYS.length];
      switch (type) {
        case PLAY_TYPE.LOOP:
          switchMusic(direction);
          break;
        case PLAY_TYPE.SINGLE:
          playTimestamp.value = 0;
          nextTick(() => startPlayback());
          isPlaying.value = true;
          break;
        case PLAY_TYPE.RANDOM:
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
      if (!el) {
        return;
      }
      playTimestamp.value = el.currentTime * 1000;
      progress.value = Number(
        Math.round((100 * playTimestamp.value) / (currentMusic.value.dt || 1)),
      );
      lyric.syncPanel(playTimestamp.value);
    };

    /** 进度条拖拽结束：把进度写回音频元素 */
    const seek = () => {
      dragging.value = false;
      if (audioEl.value) {
        audioEl.value.currentTime = playTimestamp.value / 1000;
      }
    };

    const startDragging = () => {
      if (!playlist.musicList.length) {
        return;
      }
      dragging.value = true;
      isPlaying.value = false;
      audioEl.value?.pause();
    };

    const endDragging = () => {
      if (!playlist.musicList.length) {
        return;
      }
      dragging.value = false;
      isPlaying.value = true;
      playTimestamp.value = currentMusic.value.dt * (progress.value / 100);
      audioEl.value?.play();
    };

    /** 音量滑块 change：应用到音频元素 */
    const setVolume = () => {
      dragging.value = false;
      if (audioEl.value) {
        audioEl.value.volume = volume.value / 100;
      }
    };

    const switchIsMute = () => {
      isMute.value = !isMute.value;
      if (audioEl.value) {
        audioEl.value.muted = isMute.value;
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
        errorList.value.push(currentMusic.value.id);
        isPlaying.value = false;
        audioEl.value?.pause();
      }
    };

    /** 拉取并解析当前歌曲歌词 */
    const getSongLyric = async () => {
      try {
        const res = await musicService.getLyricById({ id: currentMusic.value.id });
        lyric.parse(res?.lrc?.lyric);
      } catch {
        lyric.reset();
      }
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
      errorList,
      currentMusic,
      playTypes,
      bindAudio,
      play,
      onEnded,
      switchMusic,
      switchPlayType,
      switchPlayStatus,
      onTimeUpdate,
      seek,
      startDragging,
      endDragging,
      setVolume,
      switchIsMute,
      onError,
      getSongLyric,
      downloadMusic,
    };
  },
  {
    persist: {
      key: INDEX_STORAGE_KEY,
      storage: localStorage,
      pick: ['currentIndex'],
      // 旧格式是纯数字字符串（如 "3"），不是 JSON 对象
      serializer: {
        serialize: (data) => String(data.currentIndex ?? 0),
        deserialize: (raw) => ({ currentIndex: Number(raw) || 0 }),
      },
    },
  },
);
