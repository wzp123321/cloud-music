import { onMounted } from 'vue';
/*
 * @Description: 头部
 * @Author: wanzp
 * @Date: 2022-06-09 22:23:48
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 20:52:46
 */
import { defineComponent, ref, onUnmounted } from 'vue';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElPopover } from 'element-plus';

import header from './header.service';
import loginService from './header-loginform/header-loginform.service';
import { HL_ILoginUserVO } from './header-loginform/header-loginform.api';

import LoginForm from './header-loginform/header-loginform.vue';
import { ElMessageBox } from 'element-plus';

import { FGetCookie, FSetCookie } from '@/core/token';
import message from '@/utils/message';

import { postRequest } from '@/services/request';

enum EPath {
  退出登录 = '/logout',
}

export default defineComponent({
  name: 'Header',
  components: {
    'login-form': LoginForm,
    'el-popover': ElPopover,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const destroy$ = new Subject<void>();

    header.loadDefaultKeyword();

    const userInfo = ref<HL_ILoginUserVO>({});

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
    };

    const handleLoginDialogShow = () => {
      loginService.show();
    };

    const handleLoginOut = () => {
      console.log(1231);
      ElMessageBox.confirm('确认退出吗？', '退出登录', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        showClose: false,
        type: 'warning',
      })
        .then(async (res) => {
          if (res === 'confirm') {
            try {
              const res = await postRequest(EPath.退出登录);
              console.log(res);
              if (res) {
                message.success('退出成功');
                FSetCookie('cloud-userInfo', '');
                FSetCookie('cloud-token', '');

                userInfo.value = {};
              }
            } catch (error) {
              message.error('服务器异常');
            }
          }
        })
        .catch(() => {
          console.log('取消');
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

    onMounted(() => {
      loginService.loginResult$.pipe(takeUntil(destroy$)).subscribe((v) => {
        userInfo.value = v;
      });

      if (FGetCookie('cloud-userInfo')) {
        userInfo.value = JSON.parse(FGetCookie('cloud-userInfo') as string);
      }
    });

    onUnmounted(() => {
      destroy$.complete();
      destroy$.next();
    });

    return {
      header,
      userInfo,

      handleSearch,
      onLinkTo,
      linkToPortal,
      handleLoginDialogShow,
      handleLoginOut,
    };
  },
});
