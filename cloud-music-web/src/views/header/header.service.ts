/*
 * @Author: wanzp
 * @Date: 2022-06-08 20:37:08
 * @Last Modified by: wanzp
 * @Last Modified time: 2022-06-08 21:35:42
 */
import { HTabsVO } from './header-api';

import { menus } from './constant/index';
import { ref } from 'vue';

class HeaderService {
  //#region
  public readonly menus: HTabsVO[] = menus;
  private _currentTab = ref<string>('/');
  private _username = ref<string>('');
  //#endregion
  //#region
  public get currentTab(): string {
    return this._currentTab.value;
  }
  //#endregion
  adjustActiveTab(url: string) {
    this._currentTab.value = url;
  }
}

export default new HeaderService();
