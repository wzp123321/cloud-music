<template>
  <div class="cm-comment-block">
    <!-- 容器模式：发评 + 标题 + 热评/最新切换（传 type + id 时启用） -->
    <template v-if="isContainer">
      <div class="cmc-panel">
        <cm-comment-editor v-model="draft" :posting="posting" :tip="editorTip" @submit="onSubmit" />
      </div>
      <div class="cmc-header">
        <h5>评论<span v-if="total">（{{ total }}）</span></h5>
        <div class="cmc-tabs">
          <span :class="{ active: tab === 'hot' }" @click="switchTab('hot')">最热</span>
          <span :class="{ active: tab === 'new' }" @click="switchTab('new')">最新</span>
        </div>
      </div>
    </template>

    <!-- 评论列表：容器模式=内部列表；单条模式=外部 v-for 传入的一条 -->
    <cm-comment-item
      v-for="(item, index) in renderList"
      :key="item?.commentId ?? index"
      :item="item"
      :can-interact="canInteract"
      :floor-list="floorMap[String(item?.commentId)] || []"
      :floor-open="floorOpenId === item?.commentId"
      :hug-list="hugList"
      :hug-open="hugOpenId === item?.commentId"
      @like="onLike"
      @toggle-floor="onToggleFloor"
      @toggle-hug="onToggleHug"
    />

    <div v-if="isContainer && !loading && !renderList.length" class="cmc-empty">
      还没有评论，来说两句吧
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import CmCommentItem from './cm-comment-item.vue';
import CmCommentEditor from './cm-comment-editor.vue';
import { CM_CommentVO, CM_CommentType } from './cm-comment.api';
import { useComment } from './hooks/useComment';

const props = defineProps({
  /** 单条评论（兼容现有 v-for :commentVO 用法） */
  commentVO: {
    type: Object as PropType<CM_CommentVO>,
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

const {
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
} = useComment(props);
</script>

<style scoped lang="less">
.cm-comment-block {
  width: 100%;
}

.cmc-panel {
  margin-bottom: 8px;
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

.cmc-empty {
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 8px 0;
}
</style>
