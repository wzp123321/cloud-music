import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getRequest } from '@/apis/request';
import { PL_PlayVO } from '@/apis/play-list/index.api';
import { Common_IMusic } from '@/apis/common/index.api';
import { useSettingStore } from './setting';
// player.ts:9 顶层 import 了 playlist；这里只在 reorderMusic 函数体内惰性调用 usePlayerStore()，
// 模块初始化期不访问该绑定，运行时才取值，从而规避顶层反向 import 造成的循环依赖（详设 §4 R1）。
import { usePlayerStore } from './player';

/** 旧版本直接把队列数组写在这个 key 下，必须用自定义 serializer 保持格式兼容 */
const listStorageKey = 'cloud-music-list';

enum EPath {
  // 旧接口以 br 指定码率；实测上游 /song/url/v1 对多数曲目返回 -460「网络环境存在风险」，
  // 反而是旧接口能稳定拿到完整音源，故旧接口优先、v1 兜底。
  查询歌曲地址 = '/song/url',
  查询歌曲地址V1 = '/song/url/v1',
}

export const usePlaylistStore = defineStore(
  'playlist',
  () => {
    const setting = useSettingStore();
    // 队列唯一真相源：合并原 Player._musicList 与 PlayListService._musicList
    const musicList = ref<PL_PlayVO[]>([]);

    /**
     * 队列重排：把 from 处的歌曲移动到 to，并按当前播放歌曲 id 重算 player.currentIndex。
     * splice 移动的是原对象引用（不 spread / 不 clone），currentMusic 派生结果不变，
     * <audio :src> 稳定、播放不中断；不改 url / isPlaying / playTimestamp，不重新拉音源。
     * 顺序随本 store 既有 persist(pick musicList) 自动落盘，跨刷新保持。
     */
    const reorderMusic = (from: number, to: number) => {
      const len = musicList.value.length;
      if (
        len <= 1 ||
        !Number.isInteger(from) ||
        !Number.isInteger(to) ||
        from < 0 ||
        to < 0 ||
        from >= len ||
        to >= len ||
        from === to
      ) {
        return;
      }
      const player = usePlayerStore();
      const playingId = player.currentMusic.id;
      const [moved] = musicList.value.splice(from, 1);
      musicList.value.splice(to, 0, moved);
      if (player && typeof playingId === 'number') {
        const next = musicList.value.findIndex((item) => item.id === playingId);
        player.currentIndex = next >= 0 ? next : Math.min(player.currentIndex, musicList.value.length - 1);
      }
    };

    /**
     * 查询歌曲可播放地址，接口异常时返回空串。
     *
     * 两个坑（实测）：
     * 1. 上游 /song/url/v1 对多数曲目返回 -460「网络环境存在风险」，旧 /song/url?br= 反而稳定，
     *    所以旧接口优先、v1 兜底，取其中 audio 时长更长（非试听片段）的那个。
     * 2. 服务端 apicache 对所有 HTTP 200 缓存 2 分钟，键含完整 URL；-460 / 空结果也是 200，
     *    不带唯一参数时一次失败会被缓存住，导致「这首歌一直播不了」。故必须带 t。
     * 登录凭证由 request.ts 统一以 cookie 参数注入，登录后上游才会返回完整音源而非 30 秒试听。
     */
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

    /**
     * 上下文队列：用整张歌单替换播放队列，并把当前曲目定位到 startId。
     * 对标主流播放器「点歌单里任一曲，该歌单剩余歌曲成为后续队列」。
     * 只为起始曲补拉限时 url，其余留空，切到时由 startPlayback 按需补拉，避免 N 个并发请求。
     */
    const setQueue = async (songs: Common_IMusic[], startId: number, startUrl = ''): Promise<number> => {
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
      const index = Math.max(
        0,
        list.findIndex((item) => item.id === startId),
      );
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

    /**
     * 音质变更后作废旧音源，下次播放按新码率重拉。
     * 跳过正在播放的那首：清空它的 url 会让 <audio> 的 src 变化、播放中断。
     */
    const invalidateUrls = (exceptId?: number) => {
      musicList.value = musicList.value.map((item) => (item.id === exceptId ? item : { ...item, url: '' }));
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

    return {
      musicList,
      addMusic,
      removeMusic,
      setQueue,
      queryMusicUrl,
      invalidateUrls,
      loadFromStorage,
      reorderMusic,
    };
  },
  {
    persist: {
      key: listStorageKey,
      storage: localStorage,
      pick: ['musicList'],
      // 旧格式是纯数组，不是 { musicList: [...] }，故自定义序列化
      serializer: {
        // 音源 url 是限时地址，不能持久化；还原时置空，由 startPlayback 按需补拉
        serialize: (data) => JSON.stringify((data.musicList ?? []).map((item: PL_PlayVO) => ({ ...item, url: '' }))),
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
