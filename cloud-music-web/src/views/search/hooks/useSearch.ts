// 搜索服务
import { computed, reactive, ref } from 'vue';

import message from '@/utils/message';
import { getQueryParam } from '@/core/token';
import { getRequest } from '@/apis/request';
import {
  getSearchMultimatch,
} from '@/apis/search-enhance/index.api';
import { highValueSearch } from '@/apis/server-coverage/high-value.service';
import { Common_IMusic, Common_IAlbumVO } from '@/apis/common/index.api';
import { MvVO } from '../../../apis/artist-detail/artist-detail-api';
import { SEARCH_TYPE } from '../../../apis/search/index.api';

enum EPath {
  搜索 = '/search',
}

/** 歌词搜索命中项（/search/lyric） */
export interface SEARCH_LyricHit {
  id: number;
  name: string;
  artist: string;
  /** 命中的歌词片段 */
  matched: string;
  cover: string;
}

/** 其它搜索类型的通用展示项 */
export interface SEARCH_GenericHit {
  id: number;
  name: string;
  sub: string;
  cover: string;
}

// 请求序号：模块级递增，用于丢弃过期响应，防止旧请求覆盖新结果。
// query 与 queryMultimatch 各用一路，避免页面同时调用二者时互相作废。
let seq = 0;
let multimatchSeq = 0;

const create = () => {
  //#region
  // 从地址栏读取搜索关键词。
  const _keyword = ref<string>(getQueryParam('keyword') as string);

  const _type = ref<string>(SEARCH_TYPE.单曲);

  const _songs = ref<Common_IMusic[]>([]);

  const _albums = ref<Common_IAlbumVO[]>([]);

  const _mvs = ref<MvVO[]>([]);

  /** 歌词搜索结果（/search/lyric）与其余类型的通用结果 */
  const _lyrics = ref<SEARCH_LyricHit[]>([]);
  const _generic = ref<SEARCH_GenericHit[]>([]);

  /** 多重匹配概览（各类型匹配数量入口） */
  const _multimatch = ref<SEARCH_MultimatchEntry[]>([]);

  // type 原为可读写 getter/setter（模板里 v-model 会写入），用可写 computed 保持语义。
  const type = computed({
    get: () => _type.value,
    set: (value: string) => {
      _type.value = value;
    },
  });

  // 普通取值字段：交给 reactive 自动解包，模板里拿到的是值而非 Ref。
  const songs = computed(() => _songs.value);
  const albums = computed(() => _albums.value);
  const mvs = computed(() => _mvs.value);
  const lyrics = computed(() => _lyrics.value);
  const generic = computed(() => _generic.value);
  const multimatch = computed(() => _multimatch.value);
  const keyword = computed(() => _keyword.value);

  const _loadingResult = ref<boolean>(true);

  // $ 后缀字段保持为 Ref，供组件 watch(svc.loadingResult$, ...) 订阅。
  const loadingResult$ = computed(() => _loadingResult);
  //#endregion

  const query = async () => {
    const mySeq = ++seq;
    // 请求前快照 keyword 与 type，避免响应回来后用「当前」type 解析旧请求的数据
    const requestKeyword = _keyword.value;
    const requestType = _type.value;
    const params = {
      keywords: requestKeyword,
      type: Number(requestType),
    };
    _lyrics.value = [];
    _generic.value = [];
    try {
      // 歌词搜索走专用接口：data.resources[].song / matchedLyric
      if (requestType === SEARCH_TYPE.歌词) {
        const res = await highValueSearch.lyric(requestKeyword);
        if (mySeq !== seq) return;
        const resources = ((res?.data as { resources?: unknown })?.resources ?? []) as any[];
        _lyrics.value = resources.map((entry: any) => ({
          id: entry?.song?.id,
          name: entry?.song?.name ?? '',
          artist: entry?.song?.ar?.map((a: any) => a?.name).filter(Boolean).join('、') ?? '',
          matched: entry?.matchedLyric ?? entry?.highlightText ?? String(entry?.lyric ?? '').slice(0, 120),
          cover: entry?.song?.al?.picUrl ?? '',
        }));
        return;
      }
      const res = await getRequest(EPath.搜索, params);
      // 已有更新的请求发出，丢弃本次过期响应
      if (mySeq !== seq) return;
      switch (requestType) {
        case SEARCH_TYPE.单曲:
          _songs.value = res?.result?.songs?.map((item: any) => {
            return {
              dt: item?.duration,
              url: '',
              name: item?.name ?? '',
              alName: item?.album?.name ?? '',
              artist: item?.album?.artist?.name ?? '',
              picUrl: item?.album?.artist?.img1v1Url ?? '',
              id: item?.id,
            };
          });
          break;
        case SEARCH_TYPE.专辑:
          _albums.value = res?.result?.albums?.map((item: any) => {
            return {
              title: item?.name ?? '',
              artist:
                item?.artists
                  ?.map((childItem: any) => {
                    return childItem?.name;
                  })
                  ?.join('，') ?? '',
              coverImageUrl: item?.picUrl ?? '',
              publishTime: item?.publishTime ?? '',
              id: item?.id,
            };
          });
          break;
        case SEARCH_TYPE.MV:
          _mvs.value = res?.result?.mvs?.map((item: MvVO) => {
            return {
              artist: item?.artist,
              artistName: item?.artistName,
              duration: item?.duration,
              id: item?.id,
              imgurl: item?.cover,
              name: item?.name,
              playCount: item?.playCount,
              publishTime: item?.publishTime,
              status: item?.status,
            };
          });
          break;
        default: {
          // 歌手 / 歌单 / 用户 / 电台 / 视频 / 综合：统一渲染成通用卡片，避免 tab 空白
          const keyMap: Record<string, string> = {
            [SEARCH_TYPE.歌手]: 'artists',
            [SEARCH_TYPE.歌单]: 'playlists',
            [SEARCH_TYPE.用户]: 'userprofiles',
            [SEARCH_TYPE.电台]: 'djRadios',
            [SEARCH_TYPE.视频]: 'videos',
            [SEARCH_TYPE.综合]: 'songs',
          };
          const result = res?.result ?? {};
          const list = result[keyMap[requestType] ?? ''] ?? [];
          _generic.value = (Array.isArray(list) ? list : []).map((entry: any) => ({
            id: entry?.id,
            name: entry?.name ?? entry?.nickname ?? entry?.title ?? '',
            sub: entry?.artist?.name ?? entry?.creator?.nickname ?? entry?.description ?? '',
            cover: entry?.coverImgUrl ?? entry?.picUrl ?? entry?.avatarUrl ?? entry?.imgurl ?? '',
          }));
          break;
        }
      }
    } catch {
      // 过期请求的失败同样不得清空新结果
      if (mySeq !== seq) return;
      message.error('搜索失败，请稍后重试');
      _songs.value = [];
      _albums.value = [];
      _mvs.value = [];
      _lyrics.value = [];
      _generic.value = [];
    } finally {
      // 只有最新请求能结束 loading，避免旧请求提前关闭加载态
      if (mySeq === seq) _loadingResult.value = false;
    }
  };

  /** 多重匹配：拉取各类型匹配数量概览 */
  const queryMultimatch = async () => {
    const mySeq = ++multimatchSeq;
    try {
      const res = await getSearchMultimatch({ keywords: _keyword.value });
      // keyword 变化会触发重查，丢弃过期响应
      if (mySeq !== multimatchSeq) return;
      const result = res?.result ?? {};
      const orders = result.orders ?? [];
      _multimatch.value = orders
        .map((key: string) => ({
          key,
          name: multimatchName(key),
          code: multimatchCode(key),
          count: Array.isArray(result[key]) ? result[key].length : 0,
        }))
        .filter((v: SEARCH_MultimatchEntry) => v.count > 0);
    } catch {
      // 过期请求的失败不得清空新结果
      if (mySeq !== multimatchSeq) return;
      message.error('搜索失败，请稍后重试');
      _multimatch.value = [];
    }
  };

  const handleTypeChange = () => {
    query();
  };

  return reactive({
    type,
    songs,
    albums,
    mvs,
    lyrics,
    generic,
    multimatch,
    loadingResult$,
    keyword,
    query,
    queryMultimatch,
    handleTypeChange,
  });
};

/** 搜索页面状态：每次调用创建新实例，保证切换关键词后重新读取 URL 参数 */
export const useSearch = () => create();

/** 多重匹配入口项 */
export interface SEARCH_MultimatchEntry {
  /** server 返回的类型 key，如 song/artist/album/playlist/video */
  key: string;
  /** 中文名 */
  name: string;
  /** 对应 SEARCH_TYPE 的 code，点击可切换到该类型 tab */
  code: string;
  /** 该类型匹配数量 */
  count: number;
}

const MULTIMATCH_MAP: { [key: string]: { name: string; code: string } } = {
  song: { name: '单曲', code: SEARCH_TYPE.单曲 },
  artist: { name: '歌手', code: SEARCH_TYPE.歌手 },
  album: { name: '专辑', code: SEARCH_TYPE.专辑 },
  playlist: { name: '歌单', code: SEARCH_TYPE.歌单 },
  video: { name: '视频', code: SEARCH_TYPE.视频 },
};

const multimatchName = (key: string): string => MULTIMATCH_MAP[key]?.name ?? key;

const multimatchCode = (key: string): string => MULTIMATCH_MAP[key]?.code ?? '';
