import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';

import { useHeader } from './useHeader';
import { useLogin } from '../header-loginform/hooks/useLogin';
import { HL_LoginUserVO } from '../../../apis/header-loginform/index.api';
import message from '@/utils/message';
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
  const header = useHeader();
  const loginService = useLogin();

  header.loadDefaultKeyword();

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
    router.replace({
      path: '/search',
      query: {
        keyword: header.keyword,
      },
    });
    header.keyword = '';
    header.searchFocus = false;
    header.clearSuggest();
  };

  /** 聚焦搜索框：加载热搜榜 */
  const onSearchFocus = () => {
    header.searchFocus = true;
    if (!header.hotList.length) {
      header.loadHot();
    }
  };

  /** 选择热搜/建议词，跳转搜索结果页 */
  const onSelectKeyword = (keyword: string) => {
    header.searchFocus = false;
    header.clearSuggest();
    header.keyword = '';
    router.replace({
      path: '/search',
      query: {
        keyword,
      },
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
    loginService.show();
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
      header.adjustActiveTab(route.path);
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
    if (userStore.profile) {
      // 启动恢复会话：login_refresh -> login_status 刷新最新登录态
      userStore.restoreSession();
    }
  });

  return {
    header,
    userInfo,
    onLinkTo,
    linkToPortal,
    handleSearch,
    onSearchFocus,
    onSelectKeyword,
    suggestTypeText,
    handleLoginDialogShow,
    handleLoginOut,
  };
}
