/*
 * @Descrption: 搜索服务
 * @Author: wanzp
 * @Date: 2022-09-10 20:20:08
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:57:32
 */
import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { postRequest } from '@/services/request';
import { IMusic } from '@/services/common-api/common-api';
import { SEARCH_TYPE } from './search.api';

export class SearchService {
  //#region
  private _keyword = ref<string>('');

  private _type = ref<string>(SEARCH_TYPE.单曲);

  private _songs = ref<IMusic[]>([]);

  public get type(): string {
    return this._type.value;
  }

  public set type(value: string) {
    this._type.value = value;
  }

  public get songs(): IMusic[] {
    return this._songs.value;
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
    const url = '/search';
    const params = {
      keywords: this._keyword.value,
      type: this._type.value,
    };
    try {
      const res = await postRequest(url, params);

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
      }
    } catch (error) {
      this._songs.value = [];
    } finally {
      this._loadingResult$.next(false);
    }
  }

  handleTypeChange() {}
}
