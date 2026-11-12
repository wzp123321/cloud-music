<template>
  <div class="feed">
    <cm-navbar :title="'动态流 · 话题 · 相关推荐'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="feed--loginbar">
      当前未登录：<code>event</code> / <code>topic_sublist</code> 已降级，<code>event_del</code> / <code>event_forward</code> 写操作不可用
    </div>
    <div v-if="toast" class="feed--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="feed--tabs">
      <cm-button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['feed--tab', activeTab === tab.code ? 'active' : '']"
        @click="setActiveTab(tab.code)"
      >
        {{ tab.name }}
      </cm-button>
    </div>

    <!-- ==================== 5.1 动态流 ==================== -->
    <div v-if="activeTab === 'c5_1'" class="feed--panel">
      <p class="feed--panel-tip">
        <code>event</code> 列表项可点选，动态 id 自动填入 <code>event_del</code> / <code>event_forward</code>。
      </p>

      <div class="feed--grid grid-cols-2">
        <section class="feed--block feed--block--wide">
          <h3 class="feed--block-title"><code class="feed--module">event</code> 动态列表（需登录）</h3>
          <p v-if="!hasLogin" class="feed--degrade">登录后可用（已降级，不发请求）</p>
          <div class="feed--block-actions">
            <cm-button class="feed--btn" @click="loadEvent">加载动态</cm-button>
            <span class="feed--count">{{ eventList.length }} 条</span>
          </div>
          <div v-if="eventList.length" class="feed--list">
            <div
              v-for="(item, idx) in eventList"
              :key="'event_' + idx"
              class="feed--item"
              @click="onEventClick(item)"
            >
              <span class="feed--item-title">{{ item.title }}</span>
              <span class="feed--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="feed--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="feed--empty">暂无动态数据或接口返回为空</p>
        </section>

        <section class="feed--block">
          <h3 class="feed--block-title"><code class="feed--module">event_del</code> 删除动态（写操作）</h3>
          <div class="feed--form">
            <label>动态 id<cm-input v-model="eventDelId" placeholder="点选上方动态自动填入，或手填" /></label>
          </div>
          <cm-button class="feed--btn feed--btn--write" @click="doDelEvent">删除动态</cm-button>
        </section>

        <section class="feed--block">
          <h3 class="feed--block-title"><code class="feed--module">event_forward</code> 转发动态（写操作）</h3>
          <div class="feed--form">
            <label>动态 id<cm-input v-model="eventForwardId" placeholder="点选上方动态自动填入，或手填" /></label>
            <label>转发给 uid<cm-input v-model="eventForwardUid" placeholder="可选" /></label>
            <label>转发文案<cm-input v-model="eventForwardMsg" placeholder="可选" /></label>
          </div>
          <cm-button class="feed--btn feed--btn--write" @click="doForwardEvent">转发动态</cm-button>
        </section>
      </div>

      <div v-if="writeResult" class="feed--result">{{ writeResult }}</div>
    </div>

    <!-- ==================== 5.2 话题 ==================== -->
    <div v-if="activeTab === 'c5_2'" class="feed--panel">
      <p class="feed--panel-tip">
        <code>hot_topic</code> 在本页有独立调用点（与 P1 2.4 重复但不共用）；列表项可点选，
        actid 自动填入 <code>topic_detail</code> / <code>topic_detail_event_hot</code>。
      </p>

      <div class="feed--grid grid-cols-2">
        <section class="feed--block feed--block--wide">
          <h3 class="feed--block-title"><code class="feed--module">hot_topic</code> 热门话题（独立调用点）</h3>
          <div class="feed--block-actions">
            <cm-button class="feed--btn" @click="loadHotTopic">加载热门话题</cm-button>
            <span class="feed--count">{{ hotTopicList.length }} 条</span>
          </div>
          <div v-if="hotTopicList.length" class="feed--list">
            <div
              v-for="(item, idx) in hotTopicList"
              :key="'hot_' + idx"
              class="feed--item"
              @click="onHotTopicClick(item)"
            >
              <span class="feed--item-title">{{ item.title }}</span>
              <span class="feed--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="feed--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="feed--empty">暂无热门话题或接口返回为空</p>
        </section>

        <section class="feed--block">
          <h3 class="feed--block-title">
            <code class="feed--module">topic_detail</code> 话题详情（actid ← hot_topic 点选或手填）
          </h3>
          <div class="feed--form">
            <label>actid<cm-input v-model="topicActid" placeholder="点选热门话题自动填入，或手填" /></label>
            <cm-button class="feed--btn" @click="loadTopicDetail">查看话题详情</cm-button>
          </div>
          <div v-if="topicDetailList.length" class="feed--list">
            <div v-for="(item, idx) in topicDetailList" :key="'td_' + idx" class="feed--item">
              <span class="feed--item-title">{{ item.title }}</span>
              <span class="feed--item-sub">{{ item.subtitle }}</span>
            </div>
          </div>
          <p v-else class="feed--empty">暂无话题详情</p>
        </section>

        <section class="feed--block">
          <h3 class="feed--block-title">
            <code class="feed--module">topic_detail_event_hot</code> 话题热门动态（actid ← hot_topic 点选或手填）
          </h3>
          <div class="feed--form">
            <label>actid<cm-input v-model="topicActid" placeholder="与话题详情共享 actid" /></label>
            <cm-button class="feed--btn" @click="loadTopicHotEvent">查看话题热门动态</cm-button>
          </div>
          <div v-if="topicHotList.length" class="feed--list">
            <div v-for="(item, idx) in topicHotList" :key="'th_' + idx" class="feed--item">
              <span class="feed--item-title">{{ item.title }}</span>
              <span class="feed--item-sub">{{ item.subtitle }}</span>
            </div>
          </div>
          <p v-else class="feed--empty">暂无话题热门动态</p>
        </section>

        <section class="feed--block feed--block--wide">
          <h3 class="feed--block-title"><code class="feed--module">topic_sublist</code> 已订阅话题（需登录）</h3>
          <p v-if="!hasLogin" class="feed--degrade">登录后可用（已降级，不发请求）</p>
          <div class="feed--block-actions">
            <cm-button class="feed--btn" @click="loadTopicSublist">加载已订阅话题</cm-button>
            <span class="feed--count">{{ topicSubList.length }} 条</span>
          </div>
          <div v-if="topicSubList.length" class="feed--list">
            <div
              v-for="(item, idx) in topicSubList"
              :key="'sub_' + idx"
              class="feed--item"
              @click="onHotTopicClick(item)"
            >
              <span class="feed--item-title">{{ item.title }}</span>
              <span class="feed--item-sub">{{ item.subtitle }}</span>
            </div>
          </div>
          <p v-else class="feed--empty">暂无订阅话题或接口返回为空</p>
        </section>
      </div>
    </div>

    <!-- ==================== 5.3 相关推荐 ==================== -->
    <div v-if="activeTab === 'c5_3'" class="feed--panel">
      <p class="feed--panel-tip">相关推荐的 id 来自页面输入（或上游列表项），点击按钮后请求对应接口。</p>

      <div class="feed--grid grid-cols-2">
        <section class="feed--block">
          <h3 class="feed--block-title"><code class="feed--module">related_allvideo</code> 相关视频</h3>
          <div class="feed--form">
            <label>资源 id<cm-input v-model="relatedVideoId" placeholder="视频 / 资源 id" /></label>
            <cm-button class="feed--btn" @click="loadRelatedAllvideo">查看相关视频</cm-button>
          </div>
          <div v-if="relatedVideoList.length" class="feed--list">
            <div v-for="(item, idx) in relatedVideoList" :key="'rv_' + idx" class="feed--item">
              <span class="feed--item-title">{{ item.title }}</span>
              <span class="feed--item-sub">{{ item.subtitle }}</span>
            </div>
          </div>
          <p v-else class="feed--empty">暂无相关视频</p>
        </section>

        <section class="feed--block">
          <h3 class="feed--block-title"><code class="feed--module">related_playlist</code> 相关歌单</h3>
          <div class="feed--form">
            <label>歌单 id<cm-input v-model="relatedPlaylistId" placeholder="歌单 id" /></label>
            <cm-button class="feed--btn" @click="loadRelatedPlaylist">查看相关歌单</cm-button>
          </div>
          <div v-if="relatedPlaylistList.length" class="feed--list">
            <div v-for="(item, idx) in relatedPlaylistList" :key="'rp_' + idx" class="feed--item">
              <span class="feed--item-title">{{ item.title }}</span>
              <span class="feed--item-sub">{{ item.subtitle }}</span>
            </div>
          </div>
          <p v-else class="feed--empty">暂无相关歌单</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFeed } from './hooks/useFeed';

const {
  tabs,
  hasLogin,
  activeTab,
  toast,
  writeResult,
  eventList,
  eventDelId,
  eventForwardId,
  eventForwardUid,
  eventForwardMsg,
  hotTopicList,
  topicActid,
  topicDetailList,
  topicHotList,
  topicSubList,
  relatedVideoId,
  relatedVideoList,
  relatedPlaylistId,
  relatedPlaylistList,
  setActiveTab,
  clearToast,
  loadEvent,
  onEventClick,
  doDelEvent,
  doForwardEvent,
  loadHotTopic,
  onHotTopicClick,
  loadTopicDetail,
  loadTopicHotEvent,
  loadTopicSublist,
  loadRelatedAllvideo,
  loadRelatedPlaylist,
} = useFeed();
</script>

<style scoped lang="less">
.feed {
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
    grid-column: 1 / -1;
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
