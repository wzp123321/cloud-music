/*
 * @Description： 首页服务
 * @Author: wanzp
 * @Date: 2022-06-09 22:02:59
 * @Last Modified by: wanzp
 * @Last Modified time: 2022-06-09 22:36:23
 */
import { ref } from 'vue';
import { BannerVO, BannerRes } from './portal-api';

import portalService from './portal-request.service';
import { FResHandler } from '@/utils';

class PortService {
  //#region
  private _bannerList = ref<BannerVO[]>([]);
  //#endregion
  //#region
  public get bannerList(): BannerVO[] {
    return this._bannerList.value;
  }
  //#endregion
  //#region
  init() {
    this.getBannerLsit();
  }
  //#endregion
  //#region
  async getBannerLsit() {
    try {
      const res = await portalService.getBannerList();
      if (res?.code === 200 && res?.banners?.length) {
        this._bannerList.value = res?.banners;
      } else {
        this._bannerList.value = [];
      }
    } catch (error) {
      this._bannerList.value = [];
    }
  }
  //#endregion
}

export default new PortService();
