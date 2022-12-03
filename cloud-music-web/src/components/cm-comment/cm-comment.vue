<template>
  <div class="cm-comment" id="cm-comment">
    <img :src="commentVO?.user?.avatarUrl" alt="" />

    <div class="cm-comment-content">
      <p class="userinfo">
        <span class="name">
          {{ commentVO?.user?.nickname ?? '' }}
        </span>
        <span class="location">
          {{ commentVO?.ipLocation?.location }}
        </span>
      </p>

      <p class="content mt4" :title="commentVO?.content">{{ commentVO?.content }}</p>

      <div class="reply mb4" v-if="commentVO?.beReplied?.length">
        <span class="name">{{
          commentVO?.beReplied?.[0]?.user?.nickname ? `${commentVO?.beReplied?.[0]?.user?.nickname}：` : ''
        }}</span>
        <span class="text">{{ commentVO?.beReplied?.[0]?.content }}</span>
      </div>

      <div class="publish-time mt8">{{ commentVO?.timeStr }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import { CM_ICommentVO } from './cm-comment.api';
defineProps({
  commentVO: {
    type: Object as PropType<CM_ICommentVO>,
    default: {},
  },
});
</script>

<style scoped lang="less">
#cm-comment {
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
      -webkit-line-clamp: 2; // 想要超出三行显示 就把这里改成3就好了
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
        -webkit-line-clamp: 2; // 想要超出三行显示 就把这里改成3就好了
      }
    }

    .publish-time {
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  }
}
</style>
