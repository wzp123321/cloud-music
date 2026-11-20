import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';

import { useHeader } from './useHeader';
import { useLogin } from '../header-loginform/hooks/useLogin';
import { HL_LoginUserVO } from '../../../apis/header-loginform/index.api';
import message from '@/utils/message';
import { addHistory } from '@/utils/searchHistory';
import { sessionManager } from '@/core/session';
import { useUserStore } from '@/store/user';

/**
 * 头部视图编排：路由跳转、搜索交互、登录弹窗与登录态同步。
 * 数据层已在 useHeader / useLogin（均为模块级单例），这里只做视图侧编排。
 * 头部：导航跳转、搜索建议与登录态交互编排。
 */
export const useHeaderView = () => {
  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();
  const { menus, currentTab, keyword, searchFocus, hotList, hotDetail, suggestList, historyList, panelLoading, adjustActiveTab, loadDefaultKeyword, loadHot, loadSuggest, clearSuggest, loadHistory, deleteHistory, clearAllHistory } = useHeader();
  const { show: showLogin } = useLogin();

  loadDefaultKeyword();

  const userInfo = ref<HL_LoginUserVO>({});

  const onLinkTo = (url: string) => {
    router.push({
      path: url,
      query: route.query,
    });
  };

  const linkToPortal = () => {
    router.replace({
      path: '/',
    });
  };

  const handleSearch = () => {
    // 用户主动提交搜索时在 keyword 被清空前记一条历史，空白由工具函数内部过滤
    addHistory(keyword.value.trim());
    router.replace({
      path: '/search',
      query: {
        keyword: keyword.value,
      },
    });
    keyword.value = '';
    searchFocus.value = false;
    clearSuggest();
  };

  /** 聚焦搜索框：加载热搜榜并刷新本地搜索历史 */
  const onSearchFocus = () => {
    searchFocus.value = true;
    loadHistory();
    if (!hotList.value.length) {
      loadHot();
    }
  };

  /** 选择热搜/建议词，跳转搜索结果页 */
  const onSelectKeyword = (selectedKeyword: string) => {
    searchFocus.value = false;
    clearSuggest();
    keyword.value = '';
    router.replace({
      path: '/search',
      query: {
        keyword: selectedKeyword,
      },
    });
  };

  /** 点击搜索历史：回填关键词后复用既有 handleSearch 立即跳转 */
  const onSelectHistory = (word: string) => {
    keyword.value = word;
    handleSearch();
  };

  /** 删除单条搜索历史：即时生效，无需确认 */
  const onDeleteHistory = (word: string) => {
    deleteHistory(word);
  };

  /** 清空全部搜索历史：复用项目既有确认弹窗二次确认 */
  const onClearHistory = () => {
    ElMessageBox.confirm('确认清空全部搜索历史吗？', '清空搜索历史', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      showClose: false,
      type: 'warning',
    })
      .then((res) => {
        if (res === 'confirm') {
          clearAllHistory();
        }
      })
      .catch(() => {
        // 用户取消清空，不处理
      });
  };

  /** 建议类型文案 */
  const suggestTypeText = (type: string) => {
    switch (type) {
      case 'song':
        return '单曲';
      case 'artist':
        return '歌手';
      case 'album':
        return '专辑';
      case 'playlist':
        return '歌单';
      case 'mv':
        return 'MV';
      default:
        return '';
    }
  };

  const handleLoginDialogShow = () => {
    showLogin();
  };

  const handleLoginOut = () => {
    ElMessageBox.confirm('确认退出吗？', '退出登录', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      showClose: false,
      type: 'warning',
    })
      .then(async (res) => {
        if (res === 'confirm') {
          try {
            // 退出动作统一收敛到 user store：调用后端 + 清 cookie + 清状态
            const result = await userStore.logout();
            if (result) {
              message.success('退出成功');
            }
          } catch {
            message.error('服务器异常');
          }
        }
      })
      .catch(() => {
        // 用户取消退出
      });
  };

  watch(
    () => route.path,
    () => {
      adjustActiveTab(route.path);
    },
    {
      immediate: true,
    },
  );

  // 登录态由 user store 统一持有，immediate 保证首屏同步到当前值
  watch(
    () => userStore.profile,
    (profile) => {
      userInfo.value = profile ? { profile } : {};
    },
    { immediate: true },
  );

  onMounted(() => {
    // 有本地快照或有持久化会话凭证都尝试恢复：关浏览器后快照 cookie 已失效，
    // 仅剩凭证时也必须走一次 login_status，把 profile 与快照补回来。
    if (userStore.profile || sessionManager.isAlive()) {
      userStore.restoreSession();
    }
  });

  return {
    menus,
    currentTab,
    keyword,
    searchFocus,
    hotList,
    hotDetail,
    suggestList,
    historyList,
    panelLoading,
    loadSuggest,
    userInfo,
    onLinkTo,
    linkToPortal,
    handleSearch,
    onSearchFocus,
    onSelectKeyword,
    onSelectHistory,
    onDeleteHistory,
    onClearHistory,
    suggestTypeText,
    handleLoginDialogShow,
    handleLoginOut,
  };
}
