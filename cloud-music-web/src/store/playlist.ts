import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getRequest } from '@/apis/request';
import { PL_PlayVO } from '@/apis/play-list/index.api';

/** 旧版本直接把队列数组写在这个 key 下，必须用自定义 serializer 保持格式兼容 */
const LIST_STORAGE_KEY = 'cloud-music-list';

enum EPath {
  查询歌曲地址 = '/song/url',
}

export const usePlaylistStore = defineStore(
  'playlist',
  () => {
    // 队列唯一真相源：合并原 Player._musicList 与 PlayListService._musicList
    const musicList = ref<PL_PlayVO[]>([]);

    /** 查询歌曲可播放地址，接口异常时返回空串 */
    const queryMusicUrl = async (id: string): Promise<string> => {
      try {
        const res = await getRequest(EPath.查询歌曲地址, { id });
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

    return { musicList, addMusic, removeMusic, queryMusicUrl, loadFromStorage };
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
