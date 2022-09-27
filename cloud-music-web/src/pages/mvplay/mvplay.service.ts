/*
 * @Descrption: mv播放
 * @Author: wanzp
 * @Date: 2022-09-10 20:20:08
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 22:36:35
 */
import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { getRequest } from '@/services/request';

interface MvPlayVO {
  id: string;
  needPay: boolean;
  payInfo: string;
  r: number;
  size: number;
  url: string;
  validityTime: number;
}

export class MvPlayService {
  //#region
  private _id: string = '';

  private _url = ref<string>('');

  private _size = ref<number>(0);

  private readonly _loadingResult$ = new BehaviorSubject<boolean>(true);

  public get url(): string {
    return this._url.value;
  }

  public get size(): number {
    return this._size.value;
  }

  public get loadingResult$() {
    return this._loadingResult$ as unknown as Observable<boolean>;
  }

  //#endregion
  constructor(id: string) {
    this._id = id;
  }

  async query() {
    try {
      const url = '/video/url';
      const params = {
        id: this._id,
      };
      const res = await getRequest(url, params);

      if (res && res?.urls?.length) {
        this._url.value = res?.urls?.[0].url;
        this._size.value = res?.urls?.[0].size;

        this._loadingResult$.next(false);
      } else {
        this._loadingResult$.next(false);
      }
    } catch (error) {
      this._loadingResult$.next(false);
    }
  }

  play() {}
}
