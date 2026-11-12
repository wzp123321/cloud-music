import { computed, onMounted, ref, watch } from 'vue';

import {
  CM_ICommentVO,
  CM_CommentType,
  getCommentList,
  getCommentNew,
  getCommentHot,
  getCommentFloor,
  getCommentHugList,
  likeComment,
  sendComment,
} from '../cm-comment.api';

/** cm-comment 的 props 形状（.vue 内 defineProps 传入，保持单一数据源） */
export interface CommentProps {
  commentVO?: CM_ICommentVO;
  type: CM_CommentType;
  id?: number | string;
  threadId: string;
}

/**
 * 评论区编排：容器模式（发评 + 热评/最新 + 楼层 + 点赞）与单条模式共用。
 * 评论区容器：列表加载、发布、点赞、楼层与点赞用户列表的编排。
 */
export function useComment(props: CommentProps) {
  /** 是否为「评论区容器」模式：未传 commentVO 且指定了资源 */
  const isContainer = computed(
    () => !props.commentVO && props.id !== undefined && props.id !== null && props.id !== '',
  );
  /** 是否能发起点赞/楼层（需要资源类型与 id） */
  const canInteract = computed(
    () => !!props.type && props.id !== undefined && props.id !== null && props.id !== '',
  );

  const extraParam = () => (props.threadId ? { threadId: props.threadId } : {});

  // 单条模式：拷贝一份，避免直接改 props
  const singleList = ref<CM_ICommentVO[]>([]);
  watch(
    () => props.commentVO,
    (v) => {
      singleList.value = v ? [{ ...v }] : [];
    },
    { immediate: true },
  );

  // 容器模式状态
  const hotList = ref<CM_ICommentVO[]>([]);
  const latestList = ref<CM_ICommentVO[]>([]);
  const tab = ref<'hot' | 'new'>('hot');
  const total = ref(0);
  const loading = ref(false);
  const draft = ref('');
  const posting = ref(false);
  const editorTip = ref('');

  const renderList = computed(() =>
    isContainer.value
      ? tab.value === 'hot'
        ? hotList.value
        : latestList.value
      : singleList.value,
  );

  /** 加载评论：各类型列表(含热评) + 新版通用评论(按时间) */
  async function loadComments() {
    if (!isContainer.value) return;
    loading.value = true;
    try {
      const base = await getCommentList(props.type, props.id!, {
        limit: 20,
        ...extraParam(),
      });
      hotList.value = base?.hotComments ?? [];
      total.value = base?.total ?? 0;

      const newest = await getCommentNew({
        type: props.type,
        id: props.id!,
        sortType: 3,
        pageSize: 20,
        ...extraParam(),
      });
      latestList.value = newest?.data?.comments ?? base?.comments ?? [];
    } catch {
      // 接口不可用时保留空列表，评论区仍可展示
    } finally {
      loading.value = false;
    }
  }

  /** 热评兜底（comment_hot） */
  async function loadHot() {
    try {
      const res = await getCommentHot({
        type: props.type,
        id: props.id!,
        limit: 20,
        ...extraParam(),
      });
      hotList.value = res?.hotComments ?? [];
    } catch {
      // ignore
    }
  }

  const switchTab = (t: 'hot' | 'new') => {
    tab.value = t;
    if (t === 'hot' && !hotList.value.length) {
      loadHot();
    }
  };

  /** 发布评论（comment 的 add）并刷新最新列表（comment_new） */
  async function onSubmit() {
    const content = draft.value.trim();
    if (!content) {
      editorTip.value = '评论内容不能为空';
      return;
    }
    if (!canInteract.value) return;
    posting.value = true;
    editorTip.value = '';
    try {
      await sendComment({
        type: props.type,
        id: props.id!,
        content,
        ...extraParam(),
      });
      editorTip.value = '发布成功';
      draft.value = '';
      tab.value = 'new';
      const newest = await getCommentNew({
        type: props.type,
        id: props.id!,
        sortType: 3,
        pageSize: 20,
        ...extraParam(),
      });
      latestList.value = newest?.data?.comments ?? latestList.value;
    } catch {
      editorTip.value = '发布失败，请确认已登录';
    } finally {
      posting.value = false;
    }
  }

  /** 点赞 / 取消点赞（comment_like） */
  async function onLike(item: CM_ICommentVO) {
    if (!canInteract.value || !item?.commentId) return;
    const t: 1 | 0 = item.liked ? 0 : 1;
    try {
      await likeComment({
        type: props.type,
        id: props.id!,
        cid: item.commentId,
        t,
        ...extraParam(),
      });
      item.liked = t === 1;
      item.likedCount = Math.max(0, (item.likedCount ?? 0) + (t === 1 ? 1 : -1));
    } catch {
      editorTip.value = '点赞失败，请确认已登录';
    }
  }

  // 楼层评论
  const floorOpenId = ref<number | null>(null);
  const floorMap = ref<Record<string, CM_ICommentVO[]>>({});
  async function onToggleFloor(item: CM_ICommentVO) {
    if (!canInteract.value || !item?.commentId) return;
    const cid = item.commentId;
    if (floorOpenId.value === cid) {
      floorOpenId.value = null;
      return;
    }
    floorOpenId.value = cid;
    const key = String(cid);
    if (floorMap.value[key]) return;
    try {
      const res = await getCommentFloor({
        type: props.type,
        id: props.id!,
        parentCommentId: cid,
        time: item.time ?? -1,
        limit: 20,
        ...extraParam(),
      });
      floorMap.value[key] = res?.data?.comments ?? [];
    } catch {
      floorMap.value[key] = [];
    }
  }

  // 点赞用户列表
  const hugOpenId = ref<number | null>(null);
  const hugList = ref<CM_ICommentVO[]>([]);
  async function onToggleHug(item: CM_ICommentVO) {
    if (!canInteract.value || !item?.commentId) return;
    if (hugOpenId.value === item.commentId) {
      hugOpenId.value = null;
      return;
    }
    hugOpenId.value = item.commentId;
    try {
      const res = await getCommentHugList({
        type: props.type,
        id: props.id!,
        cid: item.commentId,
        ...extraParam(),
      });
      hugList.value =
        res?.data?.hugComments ?? res?.data?.comments ?? res?.hugComments ?? [];
    } catch {
      hugList.value = [];
    }
  }

  onMounted(loadComments);
  watch([() => props.type, () => props.id], loadComments);

  return {
    isContainer,
    canInteract,
    renderList,
    draft,
    posting,
    editorTip,
    tab,
    total,
    loading,
    switchTab,
    onSubmit,
    onLike,
    floorOpenId,
    floorMap,
    onToggleFloor,
    hugOpenId,
    hugList,
    onToggleHug,
  };
}
