<template>
<div class="header">
  <div class="header-box flex-row-justify-center">
    <div class="flex-row-start-center">
      <img src="../../assets/images/portal/portal-logo.png" @click="linkToPortal" />
      <ul class="header-tabs">
        <li
          v-for="(item, index) in header.menus"
          :key="'menus-' + index"
          :class="{ active: header.currentTab === item.url }"
          @click="onLinkTo(item.url)"
        >
          {{ item.name }}
        </li>
      </ul>
    </div>
    <div class="flex-row-start-center">
      <div class="header-search">
        <input
          v-model="header.keyword"
          placeholder="搜索音乐/歌手/歌单/MV"
          :maxlength="20"
          @focus="onSearchFocus"
          @input="header.loadSuggest(header.keyword)"
          @keydown.enter="handleSearch"
          @blur="header.searchFocus = false"
        />
        <div v-if="header.searchFocus" v-loading="header.panelLoading" class="header-search-panel">
          <!-- 搜索建议 -->
          <ul v-if="header.keyword && header.suggestList.length" class="header-suggest">
            <li
              v-for="(item, index) in header.suggestList"
              :key="'sg_' + index"
              @mousedown.prevent="onSelectKeyword(item.keyword)"
            >
              <span class="sg-type">{{ suggestTypeText(item.type) }}</span>
              <span class="sg-keyword">{{ item.keyword }}</span>
            </li>
          </ul>
          <!-- 热搜榜 + 热搜详情 -->
          <template v-else>
            <div v-if="header.hotList.length" class="panel-title">热搜榜</div>
            <ul v-if="header.hotList.length" class="header-hot">
              <li
                v-for="(item, index) in header.hotList"
                :key="'hot_' + index"
                @mousedown.prevent="onSelectKeyword(item.first)"
              >
                <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
                <span class="hot-word">{{ item.first }}</span>
                <span v-if="item.second" class="hot-sub">{{ item.second }}</span>
              </li>
            </ul>
            <div v-if="header.hotDetail.length" class="panel-title">热搜详情</div>
            <ul v-if="header.hotDetail.length" class="header-hot-detail">
              <li
                v-for="(item, index) in header.hotDetail"
                :key="'hd_' + index"
                @mousedown.prevent="onSelectKeyword(item.searchWord)"
              >
                <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
                <span class="hot-word">{{ item.searchWord }}</span>
                <span v-if="item.content" class="hot-content">{{ item.content }}</span>
              </li>
            </ul>
          </template>
        </div>
      </div>
      <div v-if="!userInfo?.profile?.nickname" class="header-username font14 ml16" @click="handleLoginDialogShow">
        登录/注册
      </div>
      <div v-if="!!userInfo?.profile?.nickname" class="header-username font14 ml16">
        <el-popover :show-arrow="false" :teleported="false" placement="bottom" :width="160" trigger="hover">
          <template #reference>
            <span :title="userInfo?.profile?.nickname" class="mr8">{{ userInfo?.profile?.nickname }}</span>
            <img :src="userInfo?.profile?.avatarUrl" alt="" />
          </template>
          <ul>
            <li @click="onLinkTo('/user')"><i class="iconfont icon-wode"></i>我的主页</li>
            <li><i class="iconfont icon-youxiangdenglu"></i>我的消息</li>
            <li><i class="iconfont icon-31huiyuan"></i>我的等级</li>
            <li><i class="iconfont icon-shezhi"></i>个人设置</li>
            <li @click="handleLoginOut"><i class="iconfont icon-tuichu"></i>退出</li>
          </ul>
        </el-popover>
      </div>
    </div>
  </div>

  <login-form></login-form>
</div>

</template>

<script lang="ts">
/*
 * @Description: 头部
 * @Author: wanzp
 * @Date: 2022-06-09 22:23:48
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 20:52:46
 */
import { defineComponent, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElPopover } from 'element-plus';

import { useHeader } from './header.service';
import { useLogin } from './header-loginform/header-loginform.service';
import { HL_ILoginUserVO } from './header-loginform/header-loginform.api';

import LoginForm from './header-loginform/header-loginform.vue';
import { ElMessageBox } from 'element-plus';

import message from '@/utils/message';

import { useUserStore } from '@/store/user';

export default defineComponent({
  name: 'AppHeader',
  components: {
    'login-form': LoginForm,
    'el-popover': ElPopover,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userStore = useUserStore();
    const header = useHeader();
    const loginService = useLogin();

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

      handleSearch,
      onSearchFocus,
      onSelectKeyword,
      suggestTypeText,
      onLinkTo,
      linkToPortal,
      handleLoginDialogShow,
      handleLoginOut,
    };
  },
});

</script>

<style lang="less" scoped>
.header {
  border-bottom: 1px solid var(--color-text-border);
  width: 100%;
  height: 67px;
  line-height: 67px;

  &-box {
    width: 1400px;
    margin: 0 auto;

    .header-tabs {
      li {
        cursor: pointer;
        display: inline-block;
        height: 67px;
        line-height: 67px;
        padding: 0 24px;
      }

      li:not(.active):hover {
        background-color: #ffed85;
        transition: all 233ms;
      }

      li.active {
        background-color: #ffe443;
        color: var(--color-text-title);
        font-weight: 600;
      }
    }

    img {
      cursor: pointer;
      height: 48px;
    }

    .header-search {
      position: relative;

      > input {
        width: 220px;
        height: 34px;
        padding: 0 12px;
        border: 1px solid var(--color-text-border);
        border-radius: 17px;
        background: rgba(0, 0, 0, 0.04);
        outline: none;
        font-size: 14px;
        color: var(--color-text-title);

        &:focus {
          background: #fff;
          border-color: #ffe443;
        }
      }

      &-panel {
        position: absolute;
        top: 42px;
        left: 0;
        z-index: 100;
        width: 320px;
        max-height: 460px;
        overflow-y: auto;
        padding: 8px 0;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.14);

        .panel-title {
          padding: 6px 16px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        li {
          display: flex;
          align-items: center;
          height: 32px;
          padding: 0 16px;
          font-size: 13px;
          cursor: pointer;
          color: var(--color-text-title);

          &:hover {
            background: rgba(0, 0, 0, 0.05);
          }
        }

        .hot-rank {
          width: 20px;
          color: var(--color-text-secondary);
          font-style: italic;

          &.top {
            color: #ec4141;
          }
        }

        .hot-word {
          flex: 0 0 auto;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hot-sub,
        .hot-content {
          margin-left: 8px;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--color-text-secondary);
          font-size: 12px;
        }

        .header-suggest {
          li {
            .sg-type {
              flex: 0 0 auto;
              margin-right: 8px;
              padding: 0 6px;
              border-radius: 3px;
              font-size: 11px;
              color: #ec4141;
              background: rgba(236, 65, 65, 0.1);
            }

            .sg-keyword {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    .header-username {
      display: flex;
      align-items: center;

      color: var(--color-text-secondary);
      cursor: pointer;

      > span {
        display: inline-block;
        width: 75px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      img {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }

      :deep(.el-popper.el-popover) {
        padding: 0 !important;

        li {
          line-height: 22px;
          padding: 6px 12px;
        }

        li:hover {
          background-color: rgba(0, 0, 0, 0.08);
        }

        li > i {
          margin-right: 8px;
        }
      }
    }
  }
}

</style>
