<template>
<div class="header">
  <div class="header-box flex-row-justify-center">
    <div class="flex-row-start-center">
      <cm-image src="../../assets/images/portal/portal-logo.png" @click="linkToPortal" />
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
        <cm-input
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
                <span class="hot-rank" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</span>
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
                <span class="hot-rank" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</span>
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
            <cm-image :src="userInfo?.profile?.avatarUrl" alt="" />
          </template>
          <ul>
            <li @click="onLinkTo('/user')"><cm-icon name="icon-wode"></cm-icon>我的主页</li>
            <li @click="onLinkTo('/message')"><cm-icon name="icon-youxiangdenglu"></cm-icon>我的消息</li>
            <li @click="onLinkTo('/user')"><cm-icon name="icon-31huiyuan"></cm-icon>我的等级</li>
            <li @click="onLinkTo('/account-profile')"><cm-icon name="icon-shezhi"></cm-icon>个人设置</li>
            <li @click="handleLoginOut"><cm-icon name="icon-tuichu"></cm-icon>退出</li>
          </ul>
        </el-popover>
      </div>
    </div>
  </div>

  <login-form></login-form>
</div>

</template>

<script setup lang="ts">
import { ElPopover } from 'element-plus';
import LoginForm from './header-loginform/header-loginform.vue';
import { useHeaderView } from './hooks/useHeaderView';

defineOptions({ name: 'AppHeader' });

const {
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
} = useHeaderView();
</script>

<style lang="less" scoped>
.header {
  border-bottom: 1px solid var(--color-text-border);
  width: 100%;
  height: 67px;
  line-height: 67px;

  &-box {
    max-width: 1200px;
    width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
    padding-left: 24px;
    padding-right: 24px;

    .header-tabs {
      li {
        cursor: pointer;
        display: inline-block;
        height: 67px;
        line-height: 67px;
        padding: 0 24px;
      }

      li:not(.active):hover {
        background-color: rgba(194, 12, 12, 0.08);
        transition: all 233ms;
      }

      li.active {
        background-color: #c20c0c;
        color: #fff;
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
          border-color: rgba(194, 12, 12, 0.45);
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

          &.top-three {
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
