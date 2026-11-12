import { onMounted, ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import feedService from '@/apis/feed/feed.service';

interface CardItem {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

/**
 * 动态流 · 话题 · 相关推荐（P1 5.1~5.3）调试台的数据与交互编排。
 * 从 feed.vue 抽出，模板只做展示，保持原行为与公共能力不变。
 */
export function useFeed() {
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

  /** 标签页切换：模板原用 `activeTab = tab.code` 直接给 ref 赋值，抽出后统一走此方法保响应性 */
  const setActiveTab = (code: string) => {
    activeTab.value = code;
  };

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

  return {
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
  };
}
