<template>
  <div class="message">
    <cm-navbar :title="'消息中心 · 私信 · 分享'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="message--loginbar">
      当前未登录：<code>msg_*</code> 读取型接口已降级，发送 / 评论类写操作不可用（登录后自动生效）
    </div>
    <div v-if="toast" class="message--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="message--tabs">
      <cm-button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['message--tab', activeTab === tab.code ? 'active' : '']"
        @click="setActiveTab(tab.code)"
      >
        {{ tab.name }}
      </cm-button>
    </div>

    <!-- ==================== 4.1 消息中心 ==================== -->
    <div v-if="activeTab === 'c4_1'" class="message--panel">
      <p class="message--panel-tip">
        按接口分区，点击「加载」读取；<code>msg_private</code> / <code>msg_recentcontact</code> 列表项可点选，
        自动填入私信历史的 uid 与 4.2 的 user_ids；<code>msg_comments</code> 列表项可点选，填入 4.3 的评论 cid。
      </p>

      <div class="message--grid grid-cols-2">
        <section v-for="block in msgBlocks" :key="block.code" class="message--block">
          <h3 class="message--block-title">
            <code class="message--module">{{ block.module }}</code> {{ block.name }}
          </h3>
          <p v-if="!hasLogin" class="message--degrade">登录后可用（已降级，不发请求）</p>
          <div class="message--block-actions">
            <cm-button class="message--btn" @click="loadMsg(block.code)">加载{{ block.name }}</cm-button>
            <span class="message--count">{{ msgLists[block.code].length }} 条</span>
          </div>
          <div v-if="msgLists[block.code].length" class="message--list">
            <div
              v-for="(item, idx) in msgLists[block.code]"
              :key="block.code + '_' + idx"
              class="message--item"
              @click="onMsgItemClick(block.code, item)"
            >
              <span class="message--item-title">{{ item.title }}</span>
              <span class="message--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="message--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="message--empty">暂无数据或接口返回为空</p>
        </section>
      </div>

      <!-- msg_private_history：uid 详情型，参数来自上游列表点选或页面输入 -->
      <section class="message--block message--block--wide">
        <h3 class="message--block-title">
          <code class="message--module">msg_private_history</code> 私信历史（uid ← msg_private / msg_recentcontact 点选或手填）
        </h3>
        <p v-if="!hasLogin" class="message--degrade">登录后可用（已降级，不发请求）</p>
        <div class="message--form">
          <label>对方 uid<cm-input v-model="historyUid" placeholder="点选私信 / 最近联系人自动填入，或手填" /></label>
          <label>条数<cm-input v-model.number="historyLimit" type="number" min="1" /></label>
          <cm-button class="message--btn" @click="loadPrivateHistory">加载私信历史</cm-button>
        </div>
        <div v-if="historyList.length" class="message--list">
          <div v-for="(item, idx) in historyList" :key="'hist_' + idx" class="message--item">
            <span class="message--item-title">{{ item.title }}</span>
            <span class="message--item-sub">{{ item.subtitle }}</span>
          </div>
        </div>
        <p v-else class="message--empty">暂无私信历史</p>
      </section>
    </div>

    <!-- ==================== 4.2 分享与私信发送 ==================== -->
    <div v-if="activeTab === 'c4_2'" class="message--panel">
      <p class="message--panel-tip">
        以下 5 个均为写操作：未登录不发请求，点击后需 <code>window.confirm</code> 二次确认，绝不在进入页面时自动调用。
      </p>

      <section class="message--block message--block--wide">
        <h3 class="message--block-title">
          共享参数 · 目标用户 user_ids（← 4.1 私信 / 最近联系人点选，或手填，逗号分隔）
        </h3>
        <div class="message--form">
          <label>user_ids<cm-input v-model="targetUserIds" placeholder="如 123456,789012" /></label>
        </div>
      </section>

      <div class="message--grid grid-cols-2">
        <section class="message--block">
          <h3 class="message--block-title"><code class="message--module">send_text</code> 发送文本私信</h3>
          <div class="message--form">
            <label>内容 msg<cm-input v-model="sendTextMsg" placeholder="说点什么" /></label>
          </div>
          <cm-button class="message--btn message--btn--write" @click="doSendText">发送文本</cm-button>
        </section>

        <section class="message--block">
          <h3 class="message--block-title"><code class="message--module">send_song</code> 发送歌曲</h3>
          <div class="message--form">
            <label>歌曲 id<cm-input v-model="sendSongId" placeholder="歌曲 id" /></label>
            <label>附言 msg<cm-input v-model="sendSongMsg" placeholder="附言（可选）" /></label>
          </div>
          <cm-button class="message--btn message--btn--write" @click="doSendSong">发送歌曲</cm-button>
        </section>

        <section class="message--block">
          <h3 class="message--block-title"><code class="message--module">send_playlist</code> 发送歌单</h3>
          <div class="message--form">
            <label>歌单 id<cm-input v-model="sendPlaylistId" placeholder="歌单 id" /></label>
            <label>附言 msg<cm-input v-model="sendPlaylistMsg" placeholder="附言（可选）" /></label>
          </div>
          <cm-button class="message--btn message--btn--write" @click="doSendPlaylist">发送歌单</cm-button>
        </section>

        <section class="message--block">
          <h3 class="message--block-title"><code class="message--module">send_album</code> 发送专辑</h3>
          <div class="message--form">
            <label>专辑 id<cm-input v-model="sendAlbumId" placeholder="专辑 id" /></label>
            <label>附言 msg<cm-input v-model="sendAlbumMsg" placeholder="附言（可选）" /></label>
          </div>
          <cm-button class="message--btn message--btn--write" @click="doSendAlbum">发送专辑</cm-button>
        </section>

        <section class="message--block">
          <h3 class="message--block-title"><code class="message--module">share_resource</code> 分享资源</h3>
          <div class="message--form">
            <label>资源 id<cm-input v-model="shareId" placeholder="资源 id" /></label>
            <label>类型 type<cm-input v-model="shareType" placeholder="song / playlist / album / mv" /></label>
            <label>文案 msg<cm-input v-model="shareMsg" placeholder="分享文案（可选）" /></label>
          </div>
          <cm-button class="message--btn message--btn--write" @click="doShareResource">分享资源</cm-button>
        </section>
      </div>

      <div v-if="writeResult" class="message--result">{{ writeResult }}</div>
    </div>

    <!-- ==================== 4.3 评论补充 ==================== -->
    <div v-if="activeTab === 'c4_3'" class="message--panel">
      <p class="message--panel-tip">以下 2 个均为写操作：未登录不发请求，点击后需二次确认，不在 onMounted 自动调用。</p>

      <div class="message--grid grid-cols-2">
        <section class="message--block">
          <h3 class="message--block-title"><code class="message--module">comment</code> 通用发评论</h3>
          <div class="message--form">
            <label>操作 t<cm-input v-model="commentT" placeholder="1 发送 / 2 回复 / 3 删除" /></label>
            <label>资源类型 type<cm-input v-model="commentType" placeholder="0 歌曲 / 1 MV / 2 歌单 / 3 专辑..." /></label>
            <label>资源 id<cm-input v-model="commentId" placeholder="资源 id" /></label>
            <label>内容 content<cm-input v-model="commentContent" placeholder="评论内容" /></label>
            <label>回复 commentId<cm-input v-model="commentReplyId" placeholder="回复时填" /></label>
          </div>
          <cm-button class="message--btn message--btn--write" @click="doComment">提交评论</cm-button>
        </section>

        <section class="message--block">
          <h3 class="message--block-title">
            <code class="message--module">hug_comment</code> 评论抱抱（cid ← 4.1 msg_comments 点选）
          </h3>
          <div class="message--form">
            <label>资源 id<cm-input v-model="hugId" placeholder="资源 id" /></label>
            <label>评论 cid<cm-input v-model="hugCid" placeholder="点选收到的评论自动填入，或手填" /></label>
            <label>类型 type<cm-input v-model="hugType" placeholder="资源类型" /></label>
          </div>
          <cm-button class="message--btn message--btn--write" @click="doHugComment">抱抱评论</cm-button>
        </section>
      </div>

      <div v-if="writeResult" class="message--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from './hooks/useMessage';

const {
  tabs,
  msgBlocks,
  hasLogin,
  activeTab,
  toast,
  writeResult,
  msgLists,
  historyUid,
  historyLimit,
  historyList,
  targetUserIds,
  sendTextMsg,
  sendSongId,
  sendSongMsg,
  sendPlaylistId,
  sendPlaylistMsg,
  sendAlbumId,
  sendAlbumMsg,
  shareId,
  shareType,
  shareMsg,
  commentT,
  commentType,
  commentId,
  commentContent,
  commentReplyId,
  hugId,
  hugCid,
  hugType,
  setActiveTab,
  clearToast,
  loadMsg,
  loadPrivateHistory,
  onMsgItemClick,
  doSendText,
  doSendSong,
  doSendPlaylist,
  doSendAlbum,
  doShareResource,
  doComment,
  doHugComment,
} = useMessage();
</script>

<style scoped lang="less">
.message {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

  code {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(194, 12, 12, 0.08);
    color: var(--color-primary, #c20c0c);
    font-size: 12px;
  }

  &--loginbar {
    margin-top: 18px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #fff7e6;
    color: #ad6800;
    font-size: 13px;
  }

  &--toast {
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: 6px;
    background: #f0f7ff;
    color: #31708f;
    font-size: 13px;
    cursor: pointer;
  }

  &--tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  &--tab {
    padding: 8px 18px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 18px;
    background: var(--color-default, #fff);
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &.active {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
      background: rgba(194, 12, 12, 0.06);
    }
  }

  &--panel {
    margin-top: 22px;
  }

  &--panel-tip {
    margin-bottom: 16px;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
  }

  &--grid {
    display: grid;
    gap: 20px;
  }

  &--block {
    padding: 16px 20px;
    border-radius: 8px;
    background: var(--color-default, #fff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  &--block--wide {
    margin-top: 20px;
  }

  &--block-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  &--module {
    margin-right: 6px;
  }

  &--degrade {
    margin-top: 8px;
    color: #d48806;
    font-size: 12px;
  }

  &--block-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
  }

  &--count {
    color: #999;
    font-size: 12px;
  }

  &--btn {
    padding: 7px 16px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    background: var(--color-default, #fff);
    color: #444;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
    }
  }

  &--btn--write {
    margin-top: 12px;
    border-color: var(--color-primary, #c20c0c);
    color: var(--color-primary, #c20c0c);
  }

  &--form {
    margin-top: 12px;

    label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      color: #666;
      font-size: 13px;
      white-space: nowrap;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary, #c20c0c);
      }
    }
  }

  &--list {
    margin-top: 10px;
    max-height: 240px;
    overflow-y: auto;
  }

  &--item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 6px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;

    &:hover {
      background: #fafafa;
    }
  }

  &--item-title {
    flex: 1;
    color: #333;
    font-size: 13px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--item-sub,
  &--item-id {
    color: #aaa;
    font-size: 12px;
    white-space: nowrap;
  }

  &--empty {
    margin-top: 10px;
    color: #bbb;
    font-size: 12px;
  }

  &--result {
    margin-top: 20px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #f6ffed;
    color: #389e0d;
    font-size: 13px;
  }
}
</style>
