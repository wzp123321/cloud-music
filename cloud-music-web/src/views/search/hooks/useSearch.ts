// 搜索服务
import { ref } from 'vue';

import message from '@/utils/message';
import { getQueryParam } from '@/core/token';
import { getRequest } from '@/apis/request';
import {
  getSearchMultimatch,
} from '@/apis/search-enhance/index.api';
import { Common_IMusic, Common_IAlbumVO } from '@/apis/common/index.api';
import { MvVO } from '../../../apis/artist-detail/artist-detail-api';
import { SearchType } from '../../../apis/search/index.api';

enum EPath {
  搜索 = '/search',
}

// 请求序号：模块级递增，用于丢弃过期响应，防止旧请求覆盖新结果。
// query 与 queryMultimatch 各用一路，避免页面同时调用二者时互相作废。
let seq = 0;
let multimatchSeq = 0;

const create = () => {
  //#region
  // 从地址栏读取搜索关键词。
  const keyword = ref<string>(getQueryParam('keyword') as string);

  const type = ref<string>(SearchType.单曲);

  const songs = ref<Common_IMusic[]>([]);

  const albums = ref<Common_IAlbumVO[]>([]);

  const mvs = ref<MvVO[]>([]);

  /** 多重匹配概览（各类型匹配数量入口） */
  const multimatch = ref<SEARCH_MultimatchEntry[]>([]);

  const loadingResult$ = ref<boolean>(true);
  //#endregion

  const query = async () => {
    const mySeq = ++seq;
    // 请求前快照 keyword 与 type，避免响应回来后用「当前」type 解析旧请求的数据
    const requestKeyword = keyword.value;
    const requestType = type.value;
    const params = {
      keywords: requestKeyword,
      type: Number(requestType),
    };
    try {
      const res = await getRequest(EPath.搜索, params);
      // 已有更新的请求发出，丢弃本次过期响应
      if (mySeq !== seq) return;
      switch (requestType) {
        case SearchType.单曲:
          songs.value = res?.result?.songs?.map((item: any) => {
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
        case SearchType.专辑:
          albums.value = res?.result?.albums?.map((item: any) => {
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
        case SearchType.MV:
          mvs.value = res?.result?.mvs?.map((item: MvVO) => {
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
      }
    } catch {
      // 过期请求的失败同样不得清空新结果
      if (mySeq !== seq) return;
      message.error('搜索失败，请稍后重试');
      songs.value = [];
      albums.value = [];
      mvs.value = [];
    } finally {
      // 只有最新请求能结束 loading，避免旧请求提前关闭加载态
      if (mySeq === seq) loadingResult$.value = false;
    }
  };

  /** 多重匹配：拉取各类型匹配数量概览 */
  const queryMultimatch = async () => {
    const mySeq = ++multimatchSeq;
    try {
      const res = await getSearchMultimatch({ keywords: keyword.value });
      // keyword 变化会触发重查，丢弃过期响应
      if (mySeq !== multimatchSeq) return;
      const result = res?.result ?? {};
      const orders = result.orders ?? [];
      multimatch.value = orders
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
      multimatch.value = [];
    }
  };

  const handleTypeChange = () => {
    query();
  };

  return {
    type,
    songs,
    albums,
    mvs,
    multimatch,
    loadingResult$,
    keyword,
    query,
    queryMultimatch,
    handleTypeChange,
  };
};

/** 搜索页面状态：每次调用创建新实例，保证切换关键词后重新读取 URL 参数 */
export const useSearch = () => create();

/** 多重匹配入口项 */
export interface SEARCH_MultimatchEntry {
  /** server 返回的类型 key，如 song/artist/album/playlist/video */
  key: string;
  /** 中文名 */
  name: string;
  /** 对应 SearchType 的 code，点击可切换到该类型 tab */
  code: string;
  /** 该类型匹配数量 */
  count: number;
}

const multimatchMap: { [key: string]: { name: string; code: string } } = {
  song: { name: '单曲', code: SearchType.单曲 },
  artist: { name: '歌手', code: SearchType.歌手 },
  album: { name: '专辑', code: SearchType.专辑 },
  playlist: { name: '歌单', code: SearchType.歌单 },
  video: { name: '视频', code: SearchType.视频 },
};

const multimatchName = (key: string): string => multimatchMap[key]?.name ?? key;

const multimatchCode = (key: string): string => multimatchMap[key]?.code ?? '';
