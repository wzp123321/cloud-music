/*
 * @Author: wanzp
 * @Date: 2022-06-08 20:37:08
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 20:53:57
 */
import { ref } from 'vue';

import { menus as menuTabs } from './constant/index';

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

// 建议类型映射（模块级纯函数，不依赖实例状态）
const mapSuggestType = (key: string): SE_ISuggestItem['type'] => {
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
};

// 创建头部共享状态：响应式数据统一用 ref，行为统一为 const 箭头函数
const create = () => {
  const _currentTab = ref<string>('/');
  const _keyword = ref<string>('');
  const _username = ref<string>('');

  /** 搜索框是否聚焦（控制热搜/建议面板显隐） */
  const _searchFocus = ref<boolean>(false);
  /** 热搜榜（search_hot） */
  const _hotList = ref<SE_IHotItem[]>([]);
  /** 热搜详情（search_hot_detail） */
  const _hotDetail = ref<SE_IHotDetailItem[]>([]);
  /** 搜索建议（search_suggest） */
  const _suggestList = ref<SE_ISuggestItem[]>([]);
  /** 面板加载态 */
  const _panelLoading = ref<boolean>(false);
  /** 建议去抖定时器（非响应式状态） */
  let suggestTimer: number | undefined;

  const adjustActiveTab = (url: string) => {
    _currentTab.value = url;
  };

  const loadDefaultKeyword = async () => {
    const url = '/search/default';
    const res = await getRequest(url);
    if (res) {
      _keyword.value = res?.data?.realkeyword;
    }
  };

  //#region 搜索增强：热搜榜 + 搜索建议
  /** 聚焦搜索框时加载热搜榜与热搜详情 */
  const loadHot = async () => {
    _panelLoading.value = true;
    try {
      const [hotRes, detailRes] = await Promise.all([
        getSearchHot(),
        getSearchHotDetail(),
      ]);
      _hotList.value = hotRes?.result?.hots ?? [];
      _hotDetail.value = detailRes?.data ?? [];
    } catch {
      _hotList.value = [];
      _hotDetail.value = [];
    } finally {
      _panelLoading.value = false;
    }
  };

  /** 输入时拉取搜索建议（带去抖） */
  const loadSuggest = (keywords: string) => {
    const kw = (keywords ?? '').trim();
    if (suggestTimer) {
      window.clearTimeout(suggestTimer);
    }
    if (!kw) {
      _suggestList.value = [];
      return;
    }
    suggestTimer = window.setTimeout(async () => {
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
        _suggestList.value = list.filter((v) => {
          if (seen.has(v.keyword)) return false;
          seen.add(v.keyword);
          return true;
        }).slice(0, 10);
      } catch {
        _suggestList.value = [];
      }
    }, 300);
  };

  /** 清空建议 */
  const clearSuggest = () => {
    if (suggestTimer) {
      window.clearTimeout(suggestTimer);
    }
    _suggestList.value = [];
  };
  //#endregion

  // 返回普通对象：值字段用 getter 包装为「值」（本 service 无 $ 字段）
  const state = {
    get menus(): HTabsVO[] {
      return menuTabs;
    },
    get currentTab(): string {
      return _currentTab.value;
    },
    get keyword(): string {
      return _keyword.value;
    },
    set keyword(value: string) {
      _keyword.value = value;
    },
    get username(): string {
      return _username.value;
    },
    get searchFocus(): boolean {
      return _searchFocus.value;
    },
    set searchFocus(value: boolean) {
      _searchFocus.value = value;
    },
    get hotList(): SE_IHotItem[] {
      return _hotList.value;
    },
    get hotDetail(): SE_IHotDetailItem[] {
      return _hotDetail.value;
    },
    get suggestList(): SE_ISuggestItem[] {
      return _suggestList.value;
    },
    get panelLoading(): boolean {
      return _panelLoading.value;
    },
    adjustActiveTab,
    loadDefaultKeyword,
    loadHot,
    loadSuggest,
    clearSuggest,
  };
  return state;
};

// 模块级缓存：保证跨组件共享同一实例
let shared: ReturnType<typeof create> | null = null;
export const useHeader = () => (shared ??= create());
