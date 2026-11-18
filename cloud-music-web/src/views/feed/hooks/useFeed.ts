import { computed, onMounted, ref } from 'vue';
import type { ApiRawResponse } from '@/apis/types';

import { useApiConsoleGuard } from '@/composables/useApiConsoleGuard';
import feedService from '@/apis/feed/feed.service';
import { extractObject, extractListByCandidates, type ApiCard } from '@/utils/api-normalize';
import { sessionManager } from '@/core/session';

type CardItem = ApiCard;

export type FeedBlockKind = 'read' | 'login-read' | 'write';

/** 输入框描述符只保存访问器：值仍读写原 ref，避免模板里嵌套 ref 的拆包歧义 */
export interface FeedBlockInput {
  label: string;
  placeholder: string;
  get: () => string;
  set: (value: string) => void;
}

export interface FeedBlockList {
  getItems: () => CardItem[];
  emptyText: string;
  onItemClick?: (item: CardItem) => void;
  showCount?: boolean;
  showId?: boolean;
}

export interface FeedBlock {
  module: string;
  name: string;
  tab: string;
  kind: FeedBlockKind;
  wide?: boolean;
  buttonText: string;
  run: () => void | Promise<void>;
  inputs?: FeedBlockInput[];
  list?: FeedBlockList;
}

/**
 * 动态流 · 话题 · 相关推荐（P1 5.1~5.3）调试台的数据与交互编排。
 * 动态页：标签切换、列表加载与互动编排。
 */
export const useFeed = () => {
  /** 与 api-inventory-plain.md「P1 动态与话题」5.1~5.3 一一对应 */
  const tabs = [
    { code: 'c5_1', name: '5.1 动态流（3）' },
    { code: 'c5_2', name: '5.2 话题（4）' },
    { code: 'c5_3', name: '5.3 相关推荐（2）' },
  ];

  const hasLogin = ref<boolean>(sessionManager.isAlive());
  const activeTab = ref<string>('c5_1');
  const toast = ref<string>('');
  const writeResult = ref<string>('');

  const { requireLogin, writeGuard } = useApiConsoleGuard(hasLogin, toast);

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

  /** 切换当前标签 */
  const setActiveTab = (code: string) => {
    activeTab.value = code;
  };

  const clearToast = () => {
    toast.value = '';
  };

  /** 候选字段优先级：动态 / 话题类接口以 events / topics / hot 为主 */
  const listCandidates = (res: ApiRawResponse): ApiRawResponse[] => [
    res.data, res.result, res.list, res.events, res.records, res.topics, res.hot,
    res.playlist, res.playlists, res.videos, res.songs, res.comments, res.notices,
    res.data?.list, res.result?.list, res.data?.data, res.data?.events, res.data?.records,
  ];

  /** 兼容 res.data / res.result / res.xxx / res.data.list 等多种结构 */
  const extractList = (res: ApiRawResponse): ApiRawResponse[] => extractListByCandidates(res, listCandidates);

  const extractObj = extractObject;

  const toCard = (raw: ApiRawResponse): CardItem => {
    const r = raw || {};
    const id = Number(r.id ?? r.actid ?? r.actId ?? r.topicId ?? r.eventId ?? r.vid ?? r.mvid ?? r.songId ?? 0) || 0;
    const title = String(r.title ?? r.name ?? r.topicName ?? r.content ?? r.msg ?? r.text ?? '未命名');
    const cover = String(r.cover ?? r.coverUrl ?? r.picUrl ?? r.avatarUrl ?? r.coverImgUrl ?? r.imgUrl ?? '');
    const subtitle = String(r.subtitle ?? r.desc ?? r.description ?? r.artist ?? r.user?.nickname ?? r.creator?.nickname ?? '');
    return { id, title, cover, subtitle, raw: r };
  };

  /** 列表型返回归一；详情型返回对象时包成一条卡片，保证有内容可展示 */
  const toList = (res: ApiRawResponse): CardItem[] => {
    const list = extractList(res);
    if (list.length) return list.map(toCard);
    const obj = extractObj(res);
    if (obj && Object.keys(obj).length) {
      return [toCard({ ...obj, title: obj.title ?? obj.name ?? obj.topicName ?? obj.content ?? `响应 code=${obj.code ?? '—'}` })];
    }
    return [];
  };

  const pickEventId = (raw: ApiRawResponse): number => {
    const r = raw || {};
    return Number(r.id ?? r.eventId ?? r.eid ?? r.actid ?? 0) || 0;
  };

  const pickActid = (raw: ApiRawResponse): number => {
    const r = raw || {};
    return Number(r.actid ?? r.actId ?? r.id ?? r.topicId ?? r.activityId ?? 0) || 0;
  };

  const runWrite = async (label: string, fn: () => Promise<ApiRawResponse>) => {
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
    if (!id) {
      toast.value = '该动态缺少 id，无法选择';
      return;
    }
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

  /** 9 个区块的展示描述，run / 访问器都指向上面既有的调用点与 ref，字段映射不变 */
  const blocks: FeedBlock[] = [
    {
      module: 'event',
      name: '动态列表（需登录）',
      tab: 'c5_1',
      kind: 'login-read',
      wide: true,
      buttonText: '加载动态',
      run: loadEvent,
      list: {
        getItems: () => eventList.value,
        emptyText: '暂无动态数据或接口返回为空',
        onItemClick: onEventClick,
        showCount: true,
        showId: true,
      },
    },
    {
      module: 'event_del',
      name: '删除动态（写操作）',
      tab: 'c5_1',
      kind: 'write',
      buttonText: '删除动态',
      run: doDelEvent,
      inputs: [
        {
          label: '动态 id',
          placeholder: '点选上方动态自动填入，或手填',
          get: () => eventDelId.value,
          set: (value) => (eventDelId.value = value),
        },
      ],
    },
    {
      module: 'event_forward',
      name: '转发动态（写操作）',
      tab: 'c5_1',
      kind: 'write',
      buttonText: '转发动态',
      run: doForwardEvent,
      inputs: [
        {
          label: '动态 id',
          placeholder: '点选上方动态自动填入，或手填',
          get: () => eventForwardId.value,
          set: (value) => (eventForwardId.value = value),
        },
        {
          label: '转发给 uid',
          placeholder: '可选',
          get: () => eventForwardUid.value,
          set: (value) => (eventForwardUid.value = value),
        },
        {
          label: '转发文案',
          placeholder: '可选',
          get: () => eventForwardMsg.value,
          set: (value) => (eventForwardMsg.value = value),
        },
      ],
    },
    {
      module: 'hot_topic',
      name: '热门话题（独立调用点）',
      tab: 'c5_2',
      kind: 'read',
      wide: true,
      buttonText: '加载热门话题',
      run: loadHotTopic,
      list: {
        getItems: () => hotTopicList.value,
        emptyText: '暂无热门话题或接口返回为空',
        onItemClick: onHotTopicClick,
        showCount: true,
        showId: true,
      },
    },
    {
      module: 'topic_detail',
      name: '话题详情（actid ← hot_topic 点选或手填）',
      tab: 'c5_2',
      kind: 'read',
      buttonText: '查看话题详情',
      run: loadTopicDetail,
      inputs: [
        {
          label: 'actid',
          placeholder: '点选热门话题自动填入，或手填',
          get: () => topicActid.value,
          set: (value) => (topicActid.value = value),
        },
      ],
      list: {
        getItems: () => topicDetailList.value,
        emptyText: '暂无话题详情',
      },
    },
    {
      module: 'topic_detail_event_hot',
      name: '话题热门动态（actid ← hot_topic 点选或手填）',
      tab: 'c5_2',
      kind: 'read',
      buttonText: '查看话题热门动态',
      run: loadTopicHotEvent,
      inputs: [
        {
          label: 'actid',
          placeholder: '与话题详情共享 actid',
          get: () => topicActid.value,
          set: (value) => (topicActid.value = value),
        },
      ],
      list: {
        getItems: () => topicHotList.value,
        emptyText: '暂无话题热门动态',
      },
    },
    {
      module: 'topic_sublist',
      name: '已订阅话题（需登录）',
      tab: 'c5_2',
      kind: 'login-read',
      wide: true,
      buttonText: '加载已订阅话题',
      run: loadTopicSublist,
      list: {
        getItems: () => topicSubList.value,
        emptyText: '暂无订阅话题或接口返回为空',
        onItemClick: onHotTopicClick,
        showCount: true,
      },
    },
    {
      module: 'related_allvideo',
      name: '相关视频',
      tab: 'c5_3',
      kind: 'read',
      buttonText: '查看相关视频',
      run: loadRelatedAllvideo,
      inputs: [
        {
          label: '资源 id',
          placeholder: '视频 / 资源 id',
          get: () => relatedVideoId.value,
          set: (value) => (relatedVideoId.value = value),
        },
      ],
      list: {
        getItems: () => relatedVideoList.value,
        emptyText: '暂无相关视频',
      },
    },
    {
      module: 'related_playlist',
      name: '相关歌单',
      tab: 'c5_3',
      kind: 'read',
      buttonText: '查看相关歌单',
      run: loadRelatedPlaylist,
      inputs: [
        {
          label: '歌单 id',
          placeholder: '歌单 id',
          get: () => relatedPlaylistId.value,
          set: (value) => (relatedPlaylistId.value = value),
        },
      ],
      list: {
        getItems: () => relatedPlaylistList.value,
        emptyText: '暂无相关歌单',
      },
    },
  ];

  const visibleBlocks = computed(() => blocks.filter((block) => block.tab === activeTab.value));

  const onBlockInput = (input: FeedBlockInput, e: Event) => {
    input.set((e.target as HTMLInputElement).value);
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
    visibleBlocks,
    setActiveTab,
    clearToast,
    onBlockInput,
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
