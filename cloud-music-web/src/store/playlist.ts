import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getRequest } from '@/apis/request';
import { PL_PlayVO } from '@/apis/play-list/index.api';
import { useSettingStore } from './setting';

/** 旧版本直接把队列数组写在这个 key 下，必须用自定义 serializer 保持格式兼容 */
const listStorageKey = 'cloud-music-list';

enum EPath {
  查询歌曲地址 = '/song/url',
}

export const usePlaylistStore = defineStore(
  'playlist',
  () => {
    const setting = useSettingStore();
    // 队列唯一真相源：合并原 Player._musicList 与 PlayListService._musicList
    const musicList = ref<PL_PlayVO[]>([]);

    /** 查询歌曲可播放地址，接口异常时返回空串 */
    const queryMusicUrl = async (id: string): Promise<string> => {
      try {
        // level 决定返回码率，取设置里的音质；服务端对无版权/无该档位的歌曲会回退
        const res = await getRequest(EPath.查询歌曲地址, { id, level: setting.audioLevel });
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

    /**
     * 音质变更后作废旧音源，下次播放按新码率重拉。
     * 跳过正在播放的那首：清空它的 url 会让 <audio> 的 src 变化、播放中断。
     */
    const invalidateUrls = (exceptId?: number) => {
      musicList.value = musicList.value.map((item) =>
        item.id === exceptId ? item : { ...item, url: '' },
      );
    };

    /** 手动从旧 key 读取一次（persist 已自动 hydrate，仅供特殊场景调用） */
    const loadFromStorage = () => {
      const raw = window.localStorage.getItem(listStorageKey);
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

    return { musicList, addMusic, removeMusic, queryMusicUrl, invalidateUrls, loadFromStorage };
  },
  {
    persist: {
      key: listStorageKey,
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
