import { useSingletonStore } from "@/store/singletons";
import type { ApiRawResponse } from '@/apis/types';
import { ref } from 'vue';

import { menus as menuTabs } from '../constant/index';

import { getRequest } from '@/apis/request';
import {
  getSearchHot,
  getSearchHotDetail,
  getSearchSuggest,
  SE_HotItem,
  SE_HotDetailItem,
  SE_SuggestItem,
} from '@/apis/search-enhance/index.api';

// 建议类型映射（模块级纯函数，不依赖实例状态）
const mapSuggestType = (key: string): SE_SuggestItem['type'] => {
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
  const currentTab = ref<string>('/');
  const keyword = ref<string>('');
  const username = ref<string>('');

  /** 搜索框是否聚焦（控制热搜/建议面板显隐） */
  const searchFocus = ref<boolean>(false);
  /** 热搜榜（search_hot） */
  const hotList = ref<SE_HotItem[]>([]);
  /** 热搜详情（search_hot_detail） */
  const hotDetail = ref<SE_HotDetailItem[]>([]);
  /** 搜索建议（search_suggest） */
  const suggestList = ref<SE_SuggestItem[]>([]);
  /** 面板加载态 */
  const panelLoading = ref<boolean>(false);
  /** 建议去抖定时器（非响应式状态） */
  let suggestTimer: number | undefined;

  const adjustActiveTab = (url: string) => {
    currentTab.value = url;
  };

  const loadDefaultKeyword = async () => {
    const url = '/search/default';
    const res = await getRequest(url);
    if (res) {
      keyword.value = res?.data?.realkeyword;
    }
  };

  //#region 搜索增强：热搜榜 + 搜索建议
  /** 聚焦搜索框时加载热搜榜与热搜详情 */
  const loadHot = async () => {
    panelLoading.value = true;
    try {
      const [hotRes, detailRes] = await Promise.all([
        getSearchHot(),
        getSearchHotDetail(),
      ]);
      hotList.value = hotRes?.result?.hots ?? [];
      hotDetail.value = detailRes?.data ?? [];
    } catch {
      hotList.value = [];
      hotDetail.value = [];
    } finally {
      panelLoading.value = false;
    }
  };

  /** 输入时拉取搜索建议（带去抖） */
  const loadSuggest = (keywords: string) => {
    const kw = (keywords ?? '').trim();
    if (suggestTimer) {
      window.clearTimeout(suggestTimer);
    }
    if (!kw) {
      suggestList.value = [];
      return;
    }
    suggestTimer = window.setTimeout(async () => {
      try {
        const res = await getSearchSuggest(kw, 'mobile');
        const order = res?.order ?? [];
        const result = res?.result ?? {};
        const list: SE_SuggestItem[] = [];
        order.forEach((key) => {
          const items = result[key] ?? [];
          items.forEach((item: ApiRawResponse) => {
            const text = item?.keyword ?? item?.name ?? item?.searchWord ?? '';
            if (text) {
              list.push({ keyword: String(text), type: mapSuggestType(key) });
            }
          });
        });
        // 去重，最多展示 10 条
        const seen = new Set<string>();
        suggestList.value = list.filter((v) => {
          if (seen.has(v.keyword)) return false;
          seen.add(v.keyword);
          return true;
        }).slice(0, 10);
      } catch {
        suggestList.value = [];
      }
    }, 300);
  };

  /** 清空建议 */
  const clearSuggest = () => {
    if (suggestTimer) {
      window.clearTimeout(suggestTimer);
    }
    suggestList.value = [];
  };
  //#endregion

  return {
    menus: menuTabs,
    currentTab,
    keyword,
    username,
    searchFocus,
    hotList,
    hotDetail,
    suggestList,
    panelLoading,
    adjustActiveTab,
    loadDefaultKeyword,
    loadHot,
    loadSuggest,
    clearSuggest,
  };
};

export const useHeader = () => useSingletonStore().get("useHeader", create);
