/*
 * @Descrption: 搜索服务
 * @Author: wanzp
 * @Date: 2022-09-10 20:20:08
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 20:58:59
 */
import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { postRequest } from '@/services/request';

export class SearchService {
  //#region
  private _keyword = ref<string>('');

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
    };
    const res = await postRequest(url, params);

    if (res) {
      console.log(res);
    }
  }
}
