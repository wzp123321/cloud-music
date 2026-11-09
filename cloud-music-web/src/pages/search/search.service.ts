/*
 * @Descrption: 搜索服务
 * @Author: wanzp
 * @Date: 2022-09-10 20:20:08
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:57:32
 */
import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { getRequest } from '@/services/request';
import {
  getSearchMultimatch,
} from '@/services/search-enhance.api';
import { Common_IMusic, Common_IAlbumVO } from '@/services/common-api/common-api';
import { MvVO } from '../artist/artist-detail/services/artist-detail-api';
import { SEARCH_TYPE } from './search.api';

enum EPath {
  搜索 = '/search',
}

export class SearchService {
  //#region
  private _keyword = ref<string>('');

  private _type = ref<string>(SEARCH_TYPE.单曲);

  private _songs = ref<Common_IMusic[]>([]);

  private _albums = ref<Common_IAlbumVO[]>([]);

  private _mvs = ref<MvVO[]>([]);

  /** 多重匹配概览（各类型匹配数量入口） */
  private _multimatch = ref<SEARCH_IMultimatchEntry[]>([]);

  public get type(): string {
    return this._type.value;
  }

  public set type(value: string) {
    this._type.value = value;
  }

  public get songs(): Common_IMusic[] {
    return this._songs.value;
  }

  public get albums(): Common_IAlbumVO[] {
    return this._albums.value;
  }

  public get mvs(): MvVO[] {
    return this._mvs.value;
  }

  public get multimatch(): SEARCH_IMultimatchEntry[] {
    return this._multimatch.value;
  }

  private readonly _loadingResult$ = new BehaviorSubject<boolean>(true);

  public get loadingResult$() {
    return this._loadingResult$ as unknown as Observable<boolean>;
  }

  public get keyword(): string {
    return this._keyword.value;
  }
  //#endregion
  constructor(keyword: string) {
    this._keyword.value = keyword;
  }

  async query() {
    const params = {
      keywords: this._keyword.value,
      type: Number(this._type.value),
    };
    try {
      const res = await getRequest(EPath.搜索, params);
      switch (this._type.value) {
        case SEARCH_TYPE.单曲:
          this._songs.value = res?.result?.songs?.map((item: any) => {
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
          this._albums.value = res?.result?.albums?.map((item: any) => {
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
          this._mvs.value = res?.result?.mvs?.map((item: MvVO) => {
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
    } catch (error) {
      this._songs.value = [];
      this._albums.value = [];
      this._mvs.value = [];
    } finally {
      this._loadingResult$.next(false);
    }
  }

  /** 多重匹配：拉取各类型匹配数量概览 */
  async queryMultimatch() {
    try {
      const res = await getSearchMultimatch({ keywords: this._keyword.value });
      const result = res?.result ?? {};
      const orders = result.orders ?? [];
      this._multimatch.value = orders
        .map((key: string) => ({
          key,
          name: multimatchName(key),
          code: multimatchCode(key),
          count: Array.isArray(result[key]) ? result[key].length : 0,
        }))
        .filter((v: SEARCH_IMultimatchEntry) => v.count > 0);
    } catch {
      this._multimatch.value = [];
    }
  }

  handleTypeChange = () => {
    this.query();
  };
}

/** 多重匹配入口项 */
export interface SEARCH_IMultimatchEntry {
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

function multimatchName(key: string): string {
  return MULTIMATCH_MAP[key]?.name ?? key;
}

function multimatchCode(key: string): string {
  return MULTIMATCH_MAP[key]?.code ?? '';
}
