<template>
  <!-- 单条评论：头像 + 内容 + 回复 + 操作 + 楼层/赞过的人展开 -->
  <div class="cm-comment-item">
    <img :src="item?.user?.avatarUrl" alt="" loading="lazy" />

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
        <span v-if="canInteract" class="cmc-like" :class="{ liked: item?.liked }" @click="emit('like', item)">
          赞 {{ item?.likedCount ?? 0 }}
        </span>
        <span v-if="canInteract" class="cmc-op" @click="emit('toggle-floor', item)">
          {{ floorOpen ? '收起楼层' : '查看楼层' }}
        </span>
        <span v-if="canInteract" class="cmc-op" @click="emit('toggle-hug', item)">
          {{ hugOpen ? '收起' : '赞过的人' }}
        </span>
      </div>

      <!-- 楼层回复 -->
      <div v-if="floorOpen" class="cmc-subpanel">
        <div
          v-for="(f, fi) in floorList || []"
          :key="'floor-' + fi"
          class="cmc-subitem"
        >
          <span class="name">{{ f?.user?.nickname ?? '' }}：</span>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="sanitizeHtml(f?.content)"></span>
        </div>
        <div v-if="!(floorList || []).length" class="cmc-empty">
          暂无楼层回复
        </div>
      </div>

      <!-- 点赞用户 -->
      <div v-if="hugOpen" class="cmc-subpanel">
        <span v-for="(h, hi) in hugList || []" :key="'hug-' + hi" class="cmc-hug-names">
          {{ h?.user?.nickname ?? h?.nickname ?? '' }}
        </span>
        <div v-if="!(hugList || []).length" class="cmc-empty">暂无点赞记录</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import { sanitizeHtml } from '@/utils/sanitize';
import { CM_ICommentVO } from './cm-comment.api';

defineProps({
  /** 单条评论数据 */
  item: {
    type: Object as PropType<CM_ICommentVO>,
    required: true,
  },
  /** 是否能发起点赞/楼层（需要资源类型与 id） */
  canInteract: {
    type: Boolean,
    default: false,
  },
  /** 已加载的楼层回复列表 */
  floorList: {
    type: Array as PropType<CM_ICommentVO[]>,
    default: () => [],
  },
  /** 已加载的点赞用户列表 */
  hugList: {
    type: Array as PropType<CM_ICommentVO[]>,
    default: () => [],
  },
  /** 楼层是否展开 */
  floorOpen: {
    type: Boolean,
    default: false,
  },
  /** 点赞用户是否展开 */
  hugOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'like', item: CM_ICommentVO): void;
  (e: 'toggle-floor', item: CM_ICommentVO): void;
  (e: 'toggle-hug', item: CM_ICommentVO): void;
}>();
</script>

<style scoped lang="less">
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
