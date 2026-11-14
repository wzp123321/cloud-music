import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getRequest } from '@/apis/request';
import { PL_PlayVO } from '@/apis/play-list/index.api';
import { Common_IMusic } from '@/apis/common/index.api';

/** 旧版本直接把队列数组写在这个 key 下，必须用自定义 serializer 保持格式兼容 */
const LIST_STORAGE_KEY = 'cloud-music-list';

enum EPath {
  // v1 以 level 区分音质(standard/exhigh/lossless/hires/sky/jymaster)，对非会员也能拿到 standard 可用音源，
  // 相比旧 /song/url(靠 br) 在部分受限曲目上更稳、更易拿到完整音源。
  查询歌曲地址 = '/song/url/v1',
}

export const usePlaylistStore = defineStore(
  'playlist',
  () => {
    // 队列唯一真相源：合并原 Player._musicList 与 PlayListService._musicList
    const musicList = ref<PL_PlayVO[]>([]);

    /**
     * 查询歌曲可播放地址，接口异常时返回空串。
     * 走 /song/url/v1 + level：v1 接受 { id, level }，返回的 data[0].url 即 CDN 直链。
     */
    const queryMusicUrl = async (id: string): Promise<string> => {
      try {
        const res = await getRequest(EPath.查询歌曲地址, { id, level: 'standard' });
        return res?.data?.[0]?.url ?? '';
      } catch {
        return '';
      }
    };

    /** 加入队列：已存在返回原索引；否则补齐 url 后插入队首并返回 0 */
    const addMusic = async (value: PL_PlayVO): Promise<number> => {
      const existing = musicList.value.findIndex((item) => item.id === value.id);
      if (existing !== -1) {
        return existing;
      }
      const url = await queryMusicUrl(String(value.id));
      musicList.value.unshift({ ...value, url });
      return 0;
    };

    /**
     * 上下文队列：用整张歌单替换播放队列，并把当前曲目定位到 startId。
     * 对标主流播放器「点歌单里任一曲，该歌单剩余歌曲成为后续队列」。
     * 只为起始曲补拉限时 url，其余留空，切到时由 startPlayback 按需补拉，避免 N 个并发请求。
     */
    const setQueue = async (
      songs: Common_IMusic[],
      startId: number,
      startUrl = '',
    ): Promise<number> => {
      if (!songs?.length) {
        return 0;
      }
      const list: PL_PlayVO[] = songs.map((song) => ({
        artist: song.artist,
        dt: song.dt,
        url: '',
        alName: song.alName ?? '',
        name: song.name,
        picUrl: song.picUrl,
        id: song.id,
      }));
      const index = Math.max(0, list.findIndex((item) => item.id === startId));
      // startUrl 用于「同一首歌换歌单」场景：先写入已有音源，替换队列时 :src 不会
      // 闪成空值打断正在进行的播放；为空时走下面的按需补拉。
      list[index].url = startUrl;
      musicList.value = list;
      if (startUrl) {
        return index;
      }
      const url = await queryMusicUrl(String(startId));
      // 补拉是异步的：期间可能已切到别的歌单，只有队列仍是本次设置的那张才写回
      if (url && musicList.value[index]?.id === startId) {
        musicList.value[index].url = url;
      }
      return index;
    };

    /** 从队列移除一首 */
    const removeMusic = (id: number) => {
      musicList.value = musicList.value.filter((item) => item.id !== id);
    };

    /** 手动从旧 key 读取一次（persist 已自动 hydrate，仅供特殊场景调用） */
    const loadFromStorage = () => {
      const raw = window.localStorage.getItem(LIST_STORAGE_KEY);
      if (!raw) {
        return;
      }
      try {
        const list = JSON.parse(raw);
        musicList.value = Array.isArray(list) ? list : [];
      } catch {
        musicList.value = [];
      }
    };

    return { musicList, addMusic, setQueue, removeMusic, queryMusicUrl, loadFromStorage };
  },
  {
    persist: {
      key: LIST_STORAGE_KEY,
      storage: localStorage,
      pick: ['musicList'],
      // 旧格式是纯数组，不是 { musicList: [...] }，故自定义序列化
      serializer: {
        // 音源 url 是限时地址，不能持久化；还原时置空，由 startPlayback 按需补拉
        serialize: (data) =>
          JSON.stringify((data.musicList ?? []).map((item: PL_PlayVO) => ({ ...item, url: '' }))),
        deserialize: (raw) => {
          try {
            const list = JSON.parse(raw);
            // 还原时同样丢弃可能过期/非法的 url，留待播放时按需补拉
            return {
              musicList: (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
                ...item,
                url: '',
              })),
            };
          } catch {
            return { musicList: [] };
          }
        },
      },
    },
  },
);
