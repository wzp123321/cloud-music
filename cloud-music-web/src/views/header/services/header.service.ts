/*
 * @Author: wanzp
 * @Date: 2022-06-08 20:37:08
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 20:53:57
 */
import { ref } from 'vue';

import { menus } from '../constant/index';

import { HTabsVO } from './header-api';
import { getRequest } from '@/services/request';

class HeaderService {
  //#region
  public readonly _menus: HTabsVO[] = menus;
  private _currentTab = ref<string>('/');
  private _keyword = ref<string>('');
  private _username = ref<string>('');

  public get menus(): HTabsVO[] {
    return this._menus;
  }
  public get currentTab(): string {
    return this._currentTab.value;
  }
  public get keyword(): string {
    return this._keyword.value;
  }
  public set keyword(value: string) {
    this._keyword.value = value;
  }
  public get username(): string {
    return this._username.value;
  }
  //#endregion
  adjustActiveTab(url: string) {
    this._currentTab.value = url;
  }

  async loadDefaultKeyword() {
    const url = '/search/default';
    const res = await getRequest(url);
    if (res) {
      this._keyword.value = res?.data?.realkeyword;
    }
  }
}

export default new HeaderService();
