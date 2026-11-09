/*
 * @Author: wanzp
 * @Date: 2022-06-08 20:37:08
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 20:53:57
 */
import { ref } from 'vue';

import { menus } from './constant/index';

import { HTabsVO } from './header-api';
import { getRequest } from '@/services/request';
import {
  getSearchHot,
  getSearchHotDetail,
  getSearchSuggest,
  SE_IHotItem,
  SE_IHotDetailItem,
  SE_ISuggestItem,
} from '@/services/search-enhance.api';

class HeaderService {
  //#region
  public readonly _menus: HTabsVO[] = menus;
  private _currentTab = ref<string>('/');
  private _keyword = ref<string>('');
  private _username = ref<string>('');

  /** 搜索框是否聚焦（控制热搜/建议面板显隐） */
  private _searchFocus = ref<boolean>(false);
  /** 热搜榜（search_hot） */
  private _hotList = ref<SE_IHotItem[]>([]);
  /** 热搜详情（search_hot_detail） */
  private _hotDetail = ref<SE_IHotDetailItem[]>([]);
  /** 搜索建议（search_suggest） */
  private _suggestList = ref<SE_ISuggestItem[]>([]);
  /** 面板加载态 */
  private _panelLoading = ref<boolean>(false);

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
  public get searchFocus(): boolean {
    return this._searchFocus.value;
  }
  public set searchFocus(value: boolean) {
    this._searchFocus.value = value;
  }
  public get hotList(): SE_IHotItem[] {
    return this._hotList.value;
  }
  public get hotDetail(): SE_IHotDetailItem[] {
    return this._hotDetail.value;
  }
  public get suggestList(): SE_ISuggestItem[] {
    return this._suggestList.value;
  }
  public get panelLoading(): boolean {
    return this._panelLoading.value;
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

  //#region 搜索增强：热搜榜 + 搜索建议
  /** 聚焦搜索框时加载热搜榜与热搜详情 */
  async loadHot() {
    this._panelLoading.value = true;
    try {
      const [hotRes, detailRes] = await Promise.all([
        getSearchHot(),
        getSearchHotDetail(),
      ]);
      this._hotList.value = hotRes?.result?.hots ?? [];
      this._hotDetail.value = detailRes?.data ?? [];
    } catch {
      this._hotList.value = [];
      this._hotDetail.value = [];
    } finally {
      this._panelLoading.value = false;
    }
  }

  /** 输入时拉取搜索建议（带去抖） */
  private _suggestTimer: number | undefined;
  loadSuggest(keywords: string) {
    const kw = (keywords ?? '').trim();
    if (this._suggestTimer) {
      window.clearTimeout(this._suggestTimer);
    }
    if (!kw) {
      this._suggestList.value = [];
      return;
    }
    this._suggestTimer = window.setTimeout(async () => {
      try {
        const res = await getSearchSuggest(kw, 'mobile');
        const order = res?.order ?? [];
        const result = res?.result ?? {};
        const list: SE_ISuggestItem[] = [];
        order.forEach((key) => {
          const items = result[key] ?? [];
          items.forEach((item: any) => {
            const text = item?.keyword ?? item?.name ?? item?.searchWord ?? '';
            if (text) {
              list.push({ keyword: String(text), type: mapSuggestType(key) });
            }
          });
        });
        // 去重，最多展示 10 条
        const seen = new Set<string>();
        this._suggestList.value = list.filter((v) => {
          if (seen.has(v.keyword)) return false;
          seen.add(v.keyword);
          return true;
        }).slice(0, 10);
      } catch {
        this._suggestList.value = [];
      }
    }, 300);
  }

  /** 清空建议 */
  clearSuggest() {
    if (this._suggestTimer) {
      window.clearTimeout(this._suggestTimer);
    }
    this._suggestList.value = [];
  }
  //#endregion
}

function mapSuggestType(key: string): SE_ISuggestItem['type'] {
  switch (key) {
    case 'songs':
    case 'song':
      return 'song';
    case 'artists':
    case 'artist':
      return 'artist';
    case 'albums':
    case 'album':
      return 'album';
    case 'playlists':
    case 'playlist':
      return 'playlist';
    case 'mvs':
    case 'mv':
      return 'mv';
    default:
      return 'other';
  }
}

export default new HeaderService();
