<template>
  <div class="cm-comment-block">
    <!-- 容器模式：发评 + 标题 + 热评/最新切换（传 type + id 时启用） -->
    <div v-if="isContainer" class="cmc-panel">
      <div class="cmc-editor">
        <textarea v-model="draft" rows="3" maxlength="500" placeholder="发表你的评论..."></textarea>
        <div class="cmc-editor-bar">
          <span class="cmc-tip">{{ editorTip }}</span>
          <button class="cmc-submit" :disabled="posting" @click="onSubmit">
            {{ posting ? '发布中' : '发布评论' }}
          </button>
        </div>
      </div>
      <div class="cmc-header">
        <h5>评论<span v-if="total">（{{ total }}）</span></h5>
        <div class="cmc-tabs">
          <span :class="{ active: tab === 'hot' }" @click="switchTab('hot')">最热</span>
          <span :class="{ active: tab === 'new' }" @click="switchTab('new')">最新</span>
        </div>
      </div>
    </div>

    <!-- 评论项：单条模式=外部 v-for 传入的一条；容器模式=组件内部列表 -->
    <div
      v-for="(item, index) in renderList"
      :key="item?.commentId ?? index"
      class="cm-comment-item"
    >
      <img :src="item?.user?.avatarUrl" alt="" />

      <div class="cm-comment-content">
        <p class="userinfo">
          <span class="name">{{ item?.user?.nickname ?? '' }}</span>
          <span v-if="item?.ipLocation?.location" class="location">
            {{ item?.ipLocation?.location }}
          </span>
        </p>

        <!-- 评论内容是服务端富文本（含表情/换行标记），只能按 HTML 渲染 -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="content mt4" :title="item?.content" v-html="sanitizeHtml(item?.content)"></p>

        <div v-if="item?.beReplied?.length" class="reply mb4">
          <span class="name">{{
            item?.beReplied?.[0]?.user?.nickname
              ? `${item?.beReplied?.[0]?.user?.nickname}：`
              : ''
          }}</span>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span class="text" v-html="sanitizeHtml(item?.beReplied?.[0]?.content)"></span>
        </div>

        <div class="cmc-actions">
          <span class="publish-time">{{ item?.timeStr }}</span>
          <span v-if="canInteract" class="cmc-like" :class="{ liked: item?.liked }" @click="onLike(item)">
            赞 {{ item?.likedCount ?? 0 }}
          </span>
          <span v-if="canInteract" class="cmc-op" @click="onToggleFloor(item)">
            {{ floorOpenId === item?.commentId ? '收起楼层' : '查看楼层' }}
          </span>
          <span v-if="canInteract" class="cmc-op" @click="onToggleHug(item)">
            {{ hugOpenId === item?.commentId ? '收起' : '赞过的人' }}
          </span>
        </div>

        <!-- 楼层回复 -->
        <div v-if="floorOpenId === item?.commentId" class="cmc-subpanel">
          <div
            v-for="(f, fi) in floorMap[String(item?.commentId)] || []"
            :key="'floor-' + fi"
            class="cmc-subitem"
          >
            <span class="name">{{ f?.user?.nickname ?? '' }}：</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="sanitizeHtml(f?.content)"></span>
          </div>
          <div v-if="!(floorMap[String(item?.commentId)] || []).length" class="cmc-empty">
            暂无楼层回复
          </div>
        </div>

        <!-- 点赞用户 -->
        <div v-if="hugOpenId === item?.commentId" class="cmc-subpanel">
          <span v-for="(h, hi) in hugList" :key="'hug-' + hi" class="cmc-hug-names">
            {{ h?.user?.nickname ?? h?.nickname ?? '' }}
          </span>
          <div v-if="!hugList.length" class="cmc-empty">暂无点赞记录</div>
        </div>
      </div>
    </div>

    <div v-if="isContainer && !loading && !renderList.length" class="cmc-empty">
      还没有评论，来说两句吧
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch, PropType } from 'vue';
import { sanitizeHtml } from '@/utils/sanitize';
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
} from './cm-comment.api';

const props = defineProps({
  /** 单条评论（兼容现有 v-for :commentVO 用法） */
  commentVO: {
    type: Object as PropType<CM_ICommentVO>,
    default: undefined,
  },
  /** 资源类型：music / album / playlist / mv / dj / video / event */
  type: {
    type: String as PropType<CM_CommentType>,
    default: 'music',
  },
  /** 资源 id */
  id: {
    type: [Number, String] as PropType<number | string>,
    default: undefined,
  },
  /** 动态(event)评论的 threadId */
  threadId: {
    type: String,
    default: '',
  },
});

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
</script>

<style scoped lang="less">
.cm-comment-block {
  width: 100%;
}

.cmc-panel {
  margin-bottom: 8px;
}

.cmc-editor {
  textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    padding: 10px 12px;
    border: 1px solid var(--color-text-divider);
    border-radius: 6px;
    font-size: 14px;
    line-height: 22px;
    color: var(--color-text);
    background: transparent;
    outline: none;
  }
}

.cmc-editor-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;

  .cmc-tip {
    font-size: 12px;
    color: var(--color-primary-active);
  }

  .cmc-submit {
    padding: 6px 18px;
    border: none;
    border-radius: 16px;
    font-size: 13px;
    color: #fff;
    background: var(--color-primary-active);
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.cmc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  border-bottom: 1px solid var(--color-text-divider);

  h5 {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
  }
}

.cmc-tabs {
  display: flex;
  gap: 16px;

  span {
    font-size: 14px;
    color: var(--color-text-secondary);
    cursor: pointer;

    &.active {
      color: var(--color-text);
      font-weight: 700;
    }
  }
}

.cm-comment-item {
  display: grid;
  grid-template-columns: 42px 1fr;
  column-gap: 16px;

  margin: 16px 0 20px;

  & > img {
    width: 42px;
    height: 42px;
    border-radius: 50%;
  }

  .cm-comment-content {
    display: flex;
    flex-direction: column;

    padding-bottom: 24px;
    border-bottom: 1px solid var(--color-text-divider);

    .userinfo {
      span.name {
        color: var(--color-text);
        font-size: 14px;
        font-weight: 700;
      }

      span.location {
        font-size: 12px;
        margin-left: 6px;
        padding: 0 6px;
        border-radius: 12px;
        background-color: rgba(0, 0, 0, 0.08);
      }
    }

    p.content {
      font-size: 14px;
      line-height: 26px;

      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .reply {
      display: flex;
      flex-direction: row;

      margin-top: 10px;
      padding-top: 6px;
      padding-left: 12px;
      border-left: 1px solid var(--color-text-divider);

      span.name {
        white-space: nowrap;
        font-size: 12px;
        color: var(--color-primary-active);
        margin-right: 8px;
      }

      span.text {
        flex: 1 1 auto;
        font-size: 12px;
        color: var(--color-text-primary);

        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
    }

    .publish-time {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
}

.cmc-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;

  .publish-time {
    font-size: 13px;
    margin-right: auto;
  }

  .cmc-like,
  .cmc-op {
    font-size: 12px;
    color: var(--color-text-secondary);
    cursor: pointer;
    user-select: none;
  }

  .cmc-like.liked {
    color: var(--color-primary-active);
  }
}

.cmc-subpanel {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);

  .cmc-subitem {
    font-size: 12px;
    line-height: 22px;
    color: var(--color-text-primary);

    .name {
      color: var(--color-primary-active);
    }
  }

  .cmc-hug-names {
    display: inline-block;
    font-size: 12px;
    color: var(--color-primary-active);
    margin-right: 10px;
  }
}

.cmc-empty {
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 8px 0;
}
</style>
