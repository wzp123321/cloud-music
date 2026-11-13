import { onMounted, reactive, ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import messageService from '@/apis/message/message.service';
import { extractObject, extractListByCandidates, type ApiCard } from '@/utils/api-normalize';

type CardItem = ApiCard;

/**
 * 消息中心 · 私信 · 分享（P1 4.1~4.3）调试台的数据与交互编排。
 * 消息中心调试台：各接口区块的数据与交互编排。
 */
export const useMessage = () => {
  /** 与 api-inventory-plain.md「P1 消息私信与分享」4.1~4.3 一一对应 */
  const tabs = [
    { code: 'c4_1', name: '4.1 消息中心（6）' },
    { code: 'c4_2', name: '4.2 分享与私信发送（5）' },
    { code: 'c4_3', name: '4.3 评论补充（2）' },
  ];

  /** 4.1 五个列表型区块，私信历史因需 uid 单独成块 */
  const msgBlocks = [
    { code: 'comments', module: 'msg_comments', name: '评论' },
    { code: 'forwards', module: 'msg_forwards', name: '@我 / 转发' },
    { code: 'notices', module: 'msg_notices', name: '通知' },
    { code: 'private', module: 'msg_private', name: '私信' },
    { code: 'recentcontact', module: 'msg_recentcontact', name: '最近联系人' },
  ];

  const hasLogin = ref<boolean>(checkLogin());
  const activeTab = ref<string>('c4_1');
  const toast = ref<string>('');
  const writeResult = ref<string>('');

  const msgLists = reactive<Record<string, CardItem[]>>({
    comments: [],
    forwards: [],
    notices: [],
    private: [],
    recentcontact: [],
  });
  const historyUid = ref<string>('');
  const historyLimit = ref<number>(30);
  const historyList = ref<CardItem[]>([]);

  const targetUserIds = ref<string>('');
  const sendTextMsg = ref<string>('');
  const sendSongId = ref<string>('');
  const sendSongMsg = ref<string>('');
  const sendPlaylistId = ref<string>('');
  const sendPlaylistMsg = ref<string>('');
  const sendAlbumId = ref<string>('');
  const sendAlbumMsg = ref<string>('');
  const shareId = ref<string>('');
  const shareType = ref<string>('song');
  const shareMsg = ref<string>('');

  const commentT = ref<string>('1');
  const commentType = ref<string>('0');
  const commentId = ref<string>('');
  const commentContent = ref<string>('');
  const commentReplyId = ref<string>('');
  const hugId = ref<string>('');
  const hugCid = ref<string>('');
  const hugType = ref<string>('0');

  /** 切换当前标签 */
  const setActiveTab = (code: string) => {
    activeTab.value = code;
  };

  const clearToast = () => {
    toast.value = '';
  };

  /** 候选字段优先级：消息类接口以 comments / notices / msgs 为主 */
  const listCandidates = (res: any): any[] => [
    res.data, res.result, res.list, res.comments, res.notices, res.msgs, res.messages,
    res.records, res.events, res.playlist, res.playlists, res.topics, res.hot,
    res.songs, res.albums, res.videos, res.data?.list, res.result?.list,
    res.data?.data, res.data?.records, res.data?.playlist, res.data?.msgs,
  ];

  /** 兼容 res.data / res.result / res.list / res.xxx / res.data.list 等多种结构 */
  const extractList = (res: any): any[] => extractListByCandidates(res, listCandidates);

  /** 详情 / 写操作返回兼容 res.data / res.result / res 本身 */
  const extractObj = extractObject;

  /** 归一为统一卡片模型 */
  const toCard = (raw: any): CardItem => {
    const r = raw || {};
    const id = Number(
      r.id ?? r.songId ?? r.commentId ?? r.userId ?? r.uid ?? r.actid ?? r.eventId ?? r.vid ?? r.mvid ?? 0,
    ) || 0;
    const title = String(r.title ?? r.name ?? r.content ?? r.nickname ?? r.msg ?? r.text ?? '未命名');
    const cover = String(
      r.cover ?? r.coverUrl ?? r.picUrl ?? r.avatarUrl ?? r.coverImgUrl ?? r.imgUrl ?? r.image ?? '',
    );
    const subtitle = String(
      r.subtitle ?? r.artist ?? r.album ?? r.desc ?? r.description ?? r.user?.nickname ??
        r.fromUser?.nickname ?? r.creator?.nickname ?? '',
    );
    return { id, title, cover, subtitle, raw: r };
  };

  const pickUid = (raw: any): number => {
    const r = raw || {};
    return Number(r.uid ?? r.userId ?? r.userid ?? r.id ?? r.fromUserid ?? r.fromUserId ??
      r.fromUser?.userId ?? r.user?.userId ?? 0) || 0;
  };

  const pickCommentId = (raw: any): number => {
    const r = raw || {};
    return Number(r.commentId ?? r.cid ?? r.id ?? 0) || 0;
  };

  const pickResourceId = (raw: any): number => {
    const r = raw || {};
    return Number(r.resourceId ?? r.id ?? r.threadId ?? 0) || 0;
  };

  /** 需登录只读接口：未登录降级提示，不请求 */
  const requireLogin = (): boolean => {
    if (!hasLogin.value) {
      toast.value = '该接口需要登录后才能查看（已降级，不发请求）';
      return false;
    }
    return true;
  };

  /** 写操作前置：未登录降级不发请求；用户点击后二次确认 */
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

  /** 写操作统一包装：confirm + try/catch + 失败给空值 + 展示多结构返回 */
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

  /** 4.1 五个列表接口各自真实调用点 */
  const loadMsg = async (code: string) => {
    if (!requireLogin()) return;
    try {
      let res: any = null;
      switch (code) {
        case 'comments':
          res = await messageService.getMsgComments({ limit: 30 });
          break;
        case 'forwards':
          res = await messageService.getMsgForwards({ limit: 30 });
          break;
        case 'notices':
          res = await messageService.getMsgNotices({ limit: 30 });
          break;
        case 'private':
          res = await messageService.getMsgPrivate({ limit: 30 });
          break;
        case 'recentcontact':
          res = await messageService.getMsgRecentcontact({ limit: 30 });
          break;
        default:
          res = null;
      }
      msgLists[code] = extractList(res).map(toCard);
      toast.value = `${code} 已加载 ${msgLists[code].length} 条`;
    } catch {
      msgLists[code] = [];
      toast.value = '接口请求失败，已返回空值';
    }
  };

  /** 4.1 msg_private_history 调用点：uid ← 私信 / 最近联系人点选或输入 */
  const loadPrivateHistory = async () => {
    if (!requireLogin()) return;
    const uid = Number(historyUid.value);
    if (!uid) {
      toast.value = '请先填写或点选对方 uid';
      return;
    }
    try {
      const res = await messageService.getMsgPrivateHistory({ uid, limit: historyLimit.value || 30 });
      historyList.value = extractList(res).map(toCard);
      toast.value = `私信历史已加载 ${historyList.value.length} 条`;
    } catch {
      historyList.value = [];
      toast.value = '接口请求失败，已返回空值';
    }
  };

  /** 列表 → 下游接口参数来源 */
  const onMsgItemClick = (code: string, item: CardItem) => {
    const raw = item.raw || {};
    if (code === 'private' || code === 'recentcontact') {
      const uid = pickUid(raw) || item.id;
      if (!uid) return;
      historyUid.value = String(uid);
      const existing = targetUserIds.value.split(',').map((s) => s.trim()).filter(Boolean);
      if (!existing.includes(String(uid))) {
        existing.push(String(uid));
        targetUserIds.value = existing.join(',');
      }
      toast.value = `已选择用户 uid=${uid}，可用于「私信历史」与 4.2 发送类接口`;
    } else if (code === 'comments') {
      const cid = pickCommentId(raw) || item.id;
      if (cid) hugCid.value = String(cid);
      const rid = pickResourceId(raw);
      if (rid) hugId.value = String(rid);
      toast.value = `已选择评论 cid=${cid}，可用于 4.3「hug_comment」`;
    }
  };

  /** 4.2 五个写操作真实调用点 */
  const doSendText = () =>
    runWrite('send_text 发送文本', () =>
      messageService.sendText({ user_ids: targetUserIds.value, msg: sendTextMsg.value }));

  const doSendSong = () =>
    runWrite('send_song 发送歌曲', () =>
      messageService.sendSong({ user_ids: targetUserIds.value, id: sendSongId.value, msg: sendSongMsg.value }));

  const doSendPlaylist = () =>
    runWrite('send_playlist 发送歌单', () =>
      messageService.sendPlaylist({ user_ids: targetUserIds.value, id: sendPlaylistId.value, msg: sendPlaylistMsg.value }));

  const doSendAlbum = () =>
    runWrite('send_album 发送专辑', () =>
      messageService.sendAlbum({ user_ids: targetUserIds.value, id: sendAlbumId.value, msg: sendAlbumMsg.value }));

  const doShareResource = () =>
    runWrite('share_resource 分享资源', () =>
      messageService.shareResource({ id: shareId.value, type: shareType.value, msg: shareMsg.value }));

  /** 4.3 两个写操作真实调用点 */
  const doComment = () =>
    runWrite('comment 发布评论', () =>
      messageService.comment({
        t: commentT.value,
        type: commentType.value,
        id: commentId.value,
        content: commentContent.value,
        commentId: commentReplyId.value,
      }));

  const doHugComment = () =>
    runWrite('hug_comment 抱抱评论', () =>
      messageService.hugComment({ id: hugId.value, cid: hugCid.value, type: hugType.value }));

  /** 仅加载读取型接口（spec：打开消息中心默认展示通知）；写操作绝不在此调用 */
  onMounted(() => {
    if (hasLogin.value) loadMsg('notices');
  });

  return {
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
  };
}
