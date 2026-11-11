<template>
  <div class="feed">
    <cm-navbar :title="'动态流 · 话题 · 相关推荐'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="feed--loginbar">
      当前未登录：<code>event</code> / <code>topic_sublist</code> 已降级，<code>event_del</code> / <code>event_forward</code> 写操作不可用
    </div>
    <div v-if="toast" class="feed--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="feed--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['feed--tab', activeTab === tab.code ? 'active' : '']"
        @click="activeTab = tab.code"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- ==================== 5.1 动态流 ==================== -->
    <div v-if="activeTab === 'c5_1'" class="feed--panel">
      <p class="feed--panel-tip">
        <code>event</code> 列表项可点选，动态 id 自动填入 <code>event_del</code> / <code>event_forward</code>。
      </p>

      <div class="feed--grid">
        <section class="feed--block feed--block--wide">
          <h3 class="feed--block-title"><code class="feed--module">event</code> 动态列表（需登录）</h3>
          <p v-if="!hasLogin" class="feed--degrade">登录后可用（已降级，不发请求）</p>
          <div class="feed--block-actions">
            <button class="feed--btn" @click="loadEvent">加载动态</button>
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
            <label>动态 id<input v-model="eventDelId" placeholder="点选上方动态自动填入，或手填" /></label>
          </div>
          <button class="feed--btn feed--btn--write" @click="doDelEvent">删除动态</button>
        </section>

        <section class="feed--block">
          <h3 class="feed--block-title"><code class="feed--module">event_forward</code> 转发动态（写操作）</h3>
          <div class="feed--form">
            <label>动态 id<input v-model="eventForwardId" placeholder="点选上方动态自动填入，或手填" /></label>
            <label>转发给 uid<input v-model="eventForwardUid" placeholder="可选" /></label>
            <label>转发文案<input v-model="eventForwardMsg" placeholder="可选" /></label>
          </div>
          <button class="feed--btn feed--btn--write" @click="doForwardEvent">转发动态</button>
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

      <div class="feed--grid">
        <section class="feed--block feed--block--wide">
          <h3 class="feed--block-title"><code class="feed--module">hot_topic</code> 热门话题（独立调用点）</h3>
          <div class="feed--block-actions">
            <button class="feed--btn" @click="loadHotTopic">加载热门话题</button>
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
            <label>actid<input v-model="topicActid" placeholder="点选热门话题自动填入，或手填" /></label>
            <button class="feed--btn" @click="loadTopicDetail">查看话题详情</button>
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
            <label>actid<input v-model="topicActid" placeholder="与话题详情共享 actid" /></label>
            <button class="feed--btn" @click="loadTopicHotEvent">查看话题热门动态</button>
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
            <button class="feed--btn" @click="loadTopicSublist">加载已订阅话题</button>
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

      <div class="feed--grid">
        <section class="feed--block">
          <h3 class="feed--block-title"><code class="feed--module">related_allvideo</code> 相关视频</h3>
          <div class="feed--form">
            <label>资源 id<input v-model="relatedVideoId" placeholder="视频 / 资源 id" /></label>
            <button class="feed--btn" @click="loadRelatedAllvideo">查看相关视频</button>
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
            <label>歌单 id<input v-model="relatedPlaylistId" placeholder="歌单 id" /></label>
            <button class="feed--btn" @click="loadRelatedPlaylist">查看相关歌单</button>
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
import { onMounted, ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import feedService from '../../apis/feed/feed.service';

interface CardItem {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

/** 与 api-inventory-plain.md「P1 动态与话题」5.1~5.3 一一对应 */
const tabs = [
  { code: 'c5_1', name: '5.1 动态流（3）' },
  { code: 'c5_2', name: '5.2 话题（4）' },
  { code: 'c5_3', name: '5.3 相关推荐（2）' },
];

const hasLogin = ref<boolean>(checkLogin());
const activeTab = ref<string>('c5_1');
const toast = ref<string>('');
const writeResult = ref<string>('');

const eventList = ref<CardItem[]>([]);
const eventDelId = ref<string>('');
const eventForwardId = ref<string>('');
const eventForwardUid = ref<string>('');
const eventForwardMsg = ref<string>('');

const hotTopicList = ref<CardItem[]>([]);
const topicActid = ref<string>('');
const topicDetailList = ref<CardItem[]>([]);
const topicHotList = ref<CardItem[]>([]);
const topicSubList = ref<CardItem[]>([]);

const relatedVideoId = ref<string>('');
const relatedVideoList = ref<CardItem[]>([]);
const relatedPlaylistId = ref<string>('');
const relatedPlaylistList = ref<CardItem[]>([]);

const clearToast = () => {
  toast.value = '';
};

/** 兼容 res.data / res.result / res.xxx / res.data.list 等多种结构 */
const extractList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const candidates = [
    res.data, res.result, res.list, res.events, res.records, res.topics, res.hot,
    res.playlist, res.playlists, res.videos, res.songs, res.comments, res.notices,
    res.data?.list, res.result?.list, res.data?.data, res.data?.events, res.data?.records,
  ];
  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }
  for (const key of Object.keys(res)) {
    if (Array.isArray(res[key])) return res[key];
  }
  return [];
};

const extractObj = (res: any): Record<string, any> => {
  if (!res) return {};
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res.result && typeof res.result === 'object' && !Array.isArray(res.result)) return res.result;
  return res;
};

const toCard = (raw: any): CardItem => {
  const r = raw || {};
  const id = Number(r.id ?? r.actid ?? r.actId ?? r.topicId ?? r.eventId ?? r.vid ?? r.mvid ?? r.songId ?? 0) || 0;
  const title = String(r.title ?? r.name ?? r.topicName ?? r.content ?? r.msg ?? r.text ?? '未命名');
  const cover = String(r.cover ?? r.coverUrl ?? r.picUrl ?? r.avatarUrl ?? r.coverImgUrl ?? r.imgUrl ?? '');
  const subtitle = String(r.subtitle ?? r.desc ?? r.description ?? r.artist ?? r.user?.nickname ?? r.creator?.nickname ?? '');
  return { id, title, cover, subtitle, raw: r };
};

/** 列表型返回归一；详情型返回对象时包成一条卡片，保证有内容可展示 */
const toList = (res: any): CardItem[] => {
  const list = extractList(res);
  if (list.length) return list.map(toCard);
  const obj = extractObj(res);
  if (obj && Object.keys(obj).length) {
    return [toCard({ ...obj, title: obj.title ?? obj.name ?? obj.topicName ?? obj.content ?? `响应 code=${obj.code ?? '—'}` })];
  }
  return [];
};

const pickEventId = (raw: any): number => {
  const r = raw || {};
  return Number(r.id ?? r.eventId ?? r.eid ?? r.actid ?? 0) || 0;
};

const pickActid = (raw: any): number => {
  const r = raw || {};
  return Number(r.actid ?? r.actId ?? r.id ?? r.topicId ?? r.activityId ?? 0) || 0;
};

/** 需登录只读：未登录降级提示，不请求 */
const requireLogin = (): boolean => {
  if (!hasLogin.value) {
    toast.value = '该接口需要登录后才能查看（已降级，不发请求）';
    return false;
  }
  return true;
};

/** 写操作：未登录降级不发请求 + 二次确认 */
const writeGuard = (confirmText: string): boolean => {
  if (!hasLogin.value) {
    toast.value = '请先登录后再执行该写操作（已降级，不发请求）';
    return false;
  }
  if (!window.confirm(confirmText)) {
    toast.value = '已取消操作';
    return false;
  }
  return true;
};

const runWrite = async (label: string, fn: () => Promise<any>) => {
  if (!writeGuard(`确定执行「${label}」吗？该操作会向服务端提交数据。`)) return;
  try {
    const res = await fn();
    const obj = extractObj(res);
    writeResult.value = `${label} 已提交｜code=${obj.code ?? res?.code ?? '—'}｜${obj.message ?? res?.message ?? '无附加信息'}`;
  } catch {
    writeResult.value = `${label} 请求失败，已按空值处理`;
  }
};

/** 5.1 event 调用点（需登录只读） */
const loadEvent = async () => {
  if (!requireLogin()) return;
  try {
    const res = await feedService.getEvent({ limit: 30 });
    eventList.value = toList(res);
    toast.value = `动态已加载 ${eventList.value.length} 条`;
  } catch {
    eventList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 列表 → 写操作参数来源 */
const onEventClick = (item: CardItem) => {
  const id = pickEventId(item.raw) || item.id;
  if (!id) return;
  eventDelId.value = String(id);
  eventForwardId.value = String(id);
  toast.value = `已选择动态 id=${id}，可用于 event_del / event_forward`;
};

/** 5.1 两个写操作调用点 */
const doDelEvent = () =>
  runWrite('event_del 删除动态', () => feedService.delEvent({ id: eventDelId.value }));

const doForwardEvent = () =>
  runWrite('event_forward 转发动态', () =>
    feedService.forwardEvent({ id: eventForwardId.value, uid: eventForwardUid.value, msg: eventForwardMsg.value }));

/** 5.2 hot_topic 独立调用点（匿名可用） */
const loadHotTopic = async () => {
  try {
    const res = await feedService.getHotTopic({ limit: 30 });
    hotTopicList.value = toList(res);
    toast.value = `热门话题已加载 ${hotTopicList.value.length} 条`;
  } catch {
    hotTopicList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 列表 → 话题详情型接口参数来源 */
const onHotTopicClick = (item: CardItem) => {
  const actid = pickActid(item.raw) || item.id;
  if (!actid) return;
  topicActid.value = String(actid);
  toast.value = `已选择话题 actid=${actid}，可用于 topic_detail / topic_detail_event_hot`;
};

/** 5.2 topic_detail 调用点 */
const loadTopicDetail = async () => {
  try {
    const res = await feedService.getTopicDetail({ actid: topicActid.value });
    topicDetailList.value = toList(res);
    toast.value = `话题详情已加载 ${topicDetailList.value.length} 条`;
  } catch {
    topicDetailList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 5.2 topic_detail_event_hot 调用点 */
const loadTopicHotEvent = async () => {
  try {
    const res = await feedService.getTopicDetailEventHot({ actid: topicActid.value });
    topicHotList.value = toList(res);
    toast.value = `话题热门动态已加载 ${topicHotList.value.length} 条`;
  } catch {
    topicHotList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 5.2 topic_sublist 调用点（需登录只读） */
const loadTopicSublist = async () => {
  if (!requireLogin()) return;
  try {
    const res = await feedService.getTopicSublist({ limit: 30 });
    topicSubList.value = toList(res);
    toast.value = `已订阅话题已加载 ${topicSubList.value.length} 条`;
  } catch {
    topicSubList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 5.3 related_allvideo 调用点 */
const loadRelatedAllvideo = async () => {
  try {
    const res = await feedService.getRelatedAllvideo({ id: relatedVideoId.value });
    relatedVideoList.value = toList(res);
    toast.value = `相关视频已加载 ${relatedVideoList.value.length} 条`;
  } catch {
    relatedVideoList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 5.3 related_playlist 调用点 */
const loadRelatedPlaylist = async () => {
  try {
    const res = await feedService.getRelatedPlaylist({ id: relatedPlaylistId.value });
    relatedPlaylistList.value = toList(res);
    toast.value = `相关歌单已加载 ${relatedPlaylistList.value.length} 条`;
  } catch {
    relatedPlaylistList.value = [];
    toast.value = '接口请求失败，已返回空值';
  }
};

/** 仅加载读取型接口：hot_topic 独立调用点 + event（登录时）；写操作绝不在此调用 */
onMounted(() => {
  loadHotTopic();
  if (hasLogin.value) loadEvent();
});
</script>

<style scoped lang="less">
.feed {
  width: 1400px;
  margin: 0 auto;
  padding: 24px 0 48px;

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
    grid-template-columns: repeat(2, 1fr);
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
