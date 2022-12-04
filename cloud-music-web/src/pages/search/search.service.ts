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
import { Common_IMusic, Common_IAblumVO } from '@/services/common-api/common-api';
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

  private _ablums = ref<Common_IAblumVO[]>([]);

  private _mvs = ref<MvVO[]>([]);

  public get type(): string {
    return this._type.value;
  }

  public set type(value: string) {
    this._type.value = value;
  }

  public get songs(): Common_IMusic[] {
    return this._songs.value;
  }

  public get ablums(): Common_IAblumVO[] {
    return this._ablums.value;
  }

  public get mvs(): MvVO[] {
    return this._mvs.value;
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
          this._ablums.value = res?.result?.albums?.map((item: any) => {
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
      this._ablums.value = [];
      this._mvs.value = [];
    } finally {
      this._loadingResult$.next(false);
    }
  }

  handleTypeChange = () => {
    this.query();
  };
}
