/*
 * @Author: wanzp
 * @Date: 2022-06-08 20:37:08
 * @Last Modified by: wanzp
 * @Last Modified time: 2022-06-09 22:28:11
 */
import { HTabsVO } from './header-api';

import { menus } from '../constant/index';
import { ref } from 'vue';

class HeaderService {
  //#region
  public readonly _menus: HTabsVO[] = menus;
  private _currentTab = ref<string>('/');
  private _username = ref<string>('');
  //#endregion
  //#region
  public get currentTab(): string {
    return this._currentTab.value;
  }
  public get menus(): HTabsVO[] {
    return this._menus;
  }
  //#endregion
  //#region
  adjustActiveTab(url: string) {
    this._currentTab.value = url;
  }
  //#endregion
  //#region
  linkToPortal() {
    window.location.href = '/';
  }
  //#endregion
}

export default new HeaderService();
