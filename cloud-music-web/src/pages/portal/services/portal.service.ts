/*
 * @Description： 首页服务
 * @Author: wanzp
 * @Date: 2022-06-09 22:02:59
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-06-11 22:13:27
 */
import { ref } from 'vue';
import router from '@/router';

import { BannerVO, BannerRes, PlayListRes } from './portal-api';

import portalService from './portal-request.service';

import { TARGET_TYPE } from '@/config/enum';

import { recommendPlayListNavs } from '../constant/index';

class PortService {
  //#region
  private _loading = ref<boolean>(false);
  private _bannerList = ref<BannerVO[]>([]);
  public readonly recommendPlayListNavs = recommendPlayListNavs; // 推荐歌单类型
  private _selectedRecommendPlayListType = ref<string>(recommendPlayListNavs[0].code);
  //#endregion
  //#region
  public get loading(): boolean {
    return this._loading.value;
  }
  public get bannerList(): BannerVO[] {
    return this._bannerList.value;
  }
  public get selectedRecommendPlayListType(): string {
    return this._selectedRecommendPlayListType.value;
  }
  public set selectedRecommendPlayListType(value: string) {
    this._selectedRecommendPlayListType.value = value;
  }
  //#endregion
  //#region
  init() {
    this._loading.value = true;
    this.getBannerLsit();
    this.getPlayListByType();
  }
  //#endregion
  //#region
  async getBannerLsit() {
    try {
      const res: BannerRes = await portalService.getBannerList();
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
  //#region banner跳转
  handleBannerLinkTo(url: string, targetType: number, targetId: number) {
    switch (targetType) {
      case TARGET_TYPE.单曲:
      case TARGET_TYPE.专辑:
        router.push({
          path: '',
          query: {
            targetId,
          },
        });
        break;
      case TARGET_TYPE.歌单:
        router.push({
          path: '',
          query: {
            targetId,
          },
        });
        break;
      case TARGET_TYPE.独家规划:
        router.push({
          path: url,
          query: {
            targetId,
          },
        });
        break;
    }
  }
  //#endregion
  //#region 加载不同类型歌单
  async getPlayListByType() {
    const params = {
      limit: 10,
      cat: this._selectedRecommendPlayListType.value,
    };
    const res: PlayListRes = await portalService.getPlayListByType(params);
    if (res?.code === 200) {
      console.log(res);
    }
  }
}

export default new PortService();
