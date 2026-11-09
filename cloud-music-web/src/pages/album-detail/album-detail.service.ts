import { ref } from 'vue';
import { FGetQueryParam } from '@/core/token';
import infoService from './services/album-detail-service';

import { AlbumVO } from './services/album-detail-api';
import { Common_IMusic } from '../../services/common-api/common-api';
import contentEnhanceService, { hasLogin } from '@/services/content-enhance.service';
import { AlbumDetailDynamicRes, ContentAlbumItem } from '@/services/content-enhance.api';

/*
 * @Descrption: 专辑详情服务
 */
class info {
  //#region
  private _info = ref<AlbumVO>();
  private _songs = ref<Common_IMusic[]>([]);
  private _dynamic = ref<AlbumDetailDynamicRes>({});
  private _subAlbums = ref<ContentAlbumItem[]>([]);
  private _sublistNeedLogin = ref<boolean>(false);
  private _subLoading = ref<boolean>(false);
  private _actionTip = ref<string>('');
  private _id = 0;

  public get info(): AlbumVO {
    return this._info.value as AlbumVO;
  }
  public get songs(): Common_IMusic[] {
    return this._songs.value;
  }
  public get dynamic(): AlbumDetailDynamicRes {
    return this._dynamic.value;
  }
  public get subAlbums(): ContentAlbumItem[] {
    return this._subAlbums.value;
  }
  public get sublistNeedLogin(): boolean {
    return this._sublistNeedLogin.value;
  }
  public get subLoading(): boolean {
    return this._subLoading.value;
  }
  public get actionTip(): string {
    return this._actionTip.value;
  }
  //#endregion
  async query() {
    try {
      const id = FGetQueryParam('id');
      this._id = Number(id) || 0;
      const res = await infoService.getAlbumDetailById({ id: this._id });
      if (res?.code === 200) {
        this._info.value = res?.album;
        this._songs.value = res?.songs;
      } else {
        this._songs.value = [];
      }
    } catch (error) {
      this._songs.value = [];
    }
    // 专辑动态与收藏列表与详情并行加载，参数 id 同源
    this.queryDynamic();
    this.querySublist();
  }

  /** 专辑动态信息：id ← /album_detail?id=，上游来自新碟列表 albums[].id */
  async queryDynamic() {
    if (!this._id) return;
    try {
      const res = await contentEnhanceService.getAlbumDetailDynamic({ id: this._id });
      if (res?.code === 200) {
        this._dynamic.value = res;
      }
    } catch (error) {
      this._dynamic.value = {};
    }
  }

  /** 已收藏专辑列表（需登录，未登录只做 UI 降级） */
  async querySublist() {
    if (!hasLogin()) {
      this._sublistNeedLogin.value = true;
      return;
    }
    try {
      const res = await contentEnhanceService.getAlbumSublist({ limit: 12 });
      this._subAlbums.value = res?.data || [];
      this._sublistNeedLogin.value = false;
    } catch (error) {
      this._subAlbums.value = [];
    }
  }

  /** 订阅/取消订阅专辑：t=1 订阅，t=0 取消；成功后刷新动态状态 */
  async toggleSub() {
    if (!hasLogin()) {
      this._actionTip.value = '登录后可使用订阅功能';
      return;
    }
    if (!this._id || this._subLoading.value) return;
    const t = this._dynamic.value.isSub ? 0 : 1;
    this._subLoading.value = true;
    this._actionTip.value = '';
    try {
      const res = await contentEnhanceService.setAlbumSub({ id: this._id, t: t as 1 | 0 });
      if (res?.code === 200) {
        this._actionTip.value = t === 1 ? '已订阅该专辑' : '已取消订阅';
        await Promise.all([this.queryDynamic(), this.querySublist()]);
      } else {
        this._actionTip.value = res?.message || '操作未成功，请重试';
      }
    } catch (error) {
      this._actionTip.value = '订阅失败，请检查登录态';
    } finally {
      this._subLoading.value = false;
    }
  }
}

export default new info();
