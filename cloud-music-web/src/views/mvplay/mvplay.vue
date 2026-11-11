<template>
  <div id="mv-player" class="mv-player">
    <div v-loading="mvPlayer.loading" class="mp-container">
      <video :src="url" preload="auto" autoplay controls muted></video>
      <div class="mp-info">
        <h5>{{ mvDetail?.name }}</h5>
        <span>-</span>
        <h5>{{ mvDetail?.artistName }}</h5>
      </div>
      <div class="mp-data">
        <i class="iconfont icon-24gf-play"></i>
        <span>播放量：{{ mvDetail?.playCount ?? 0 }}</span>
        <!-- MV 互动数据：mv_detail_info；收藏：mv_sub -->
        <span class="mp-data--stat">点赞 {{ mvStat.likedCount ?? 0 }}</span>
        <span class="mp-data--stat">评论 {{ mvStat.commentCount ?? 0 }}</span>
        <span class="mp-data--stat">分享 {{ mvStat.shareCount ?? 0 }}</span>
        <button class="mp-data--sub-btn" :class="isSubed ? 'subed' : ''" :disabled="subLoading" @click="toggleMvSub">
          {{ isSubed ? '已收藏' : '收藏 MV' }}
        </button>
        <span v-if="subTip" class="mp-data--tip">{{ subTip }}</span>
      </div>
    </div>

    <div class="mp-comment mt36">
      <div class="mp-comment-header">
        <h5>热门评论</h5>
        <span>{{ commentRes?.hotComments?.length }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.hotComments"
        :id="mvDetail?.id"
        :key="'comment-' + index"
        :comment-v-o="item"
        type="mv"
      ></cm-comment>
      <div class="mp-comment-header mt60">
        <h5>最新评论</h5>
        <span>{{ mvDetail?.commentCount }}条</span>
      </div>
      <cm-comment
        v-for="(item, index) in commentRes?.comments"
        :id="mvDetail?.id"
        :key="'comment-' + index"
        :comment-v-o="item"
        type="mv"
      ></cm-comment>
    </div>

    <!-- 相似推荐：simi_mv -->
    <cm-simi :id="mvDetail?.id" type="mv"></cm-simi>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { FGetQueryParam } from '@/core/token';
import { useMvPlayer } from './hooks/useMvPlayer';
import { MP_IMvDetail, MP_IMVCommentRes } from '../../apis/mvplay/index.api';
import contentEnhanceService, { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { MvDetailInfoRes } from '@/apis/content-enhance/index.api';
import { useRequest } from '@/hooks/useRequest';

const mvPlayer = useMvPlayer();
// 互动数据请求统一走 useRequest（箭头体内延迟引用 loadMvStat，无 TDZ 问题）
const { run: runMvStat } = useRequest(() => loadMvStat());

/** 参数来源：mvid ← MV 列表 data[].id 或 /mvplay?mvid= */
const mvid = Number(FGetQueryParam('mvid') || 0);
const mvStat = ref<MvDetailInfoRes>({});
const isSubed = ref<boolean>(false);
const subLoading = ref<boolean>(false);
const subTip = ref<string>('');

const mvDetail = ref<MP_IMvDetail>({
  artistId: 0,
  artistName: '',
  artists: {
    followed: '',
    id: '',
    img1v1Url: '',
    name: '',
  },
  commentCount: '',
  commentThreadId: '',
  cover: '',
  coverId: '',
  coverId_str: '',
  desc: '',
  duration: '',
  id: '',
  nType: '',
  name: '',
  playCount: '',
  price: '',
  publishTime: '',
  shareCount: '',
  subCount: '',
});
const url = ref<string>('');
const commentRes = ref<MP_IMVCommentRes>({
  comments: [],
  hotComments: [],
});

/** MV 互动数据：mv_detail_info */
const loadMvStat = async () => {
  if (!mvid) return;
  try {
    const res = await contentEnhanceService.getMvDetailInfo({ mvid });
    if (res?.code === 200) mvStat.value = res;
  } catch {
    mvStat.value = {};
  }
};

/** 收藏状态：mv_sublist（需登录，未登录时不请求） */
const loadSubState = async () => {
  if (!mvid || !hasLogin()) return;
  try {
    const res = await contentEnhanceService.getMvSublist({ limit: 100 });
    isSubed.value = (res?.data || []).some((item: any) => Number(item.id || item.mvid) === mvid);
  } catch {
    isSubed.value = false;
  }
};

/** 收藏/取消收藏 MV：mv_sub（需登录，成功后刷新收藏状态） */
const toggleMvSub = async () => {
  if (!hasLogin()) {
    subTip.value = '登录后可收藏 MV';
    return;
  }
  if (!mvid || subLoading.value) return;
  subLoading.value = true;
  subTip.value = '';
  const t = isSubed.value ? 0 : 1;
  try {
    const res = await contentEnhanceService.setMvSub({ mvid, t: t as 1 | 0 });
    if (res?.code === 200) {
      isSubed.value = t === 1;
      subTip.value = t === 1 ? '已收藏该 MV' : '已取消收藏';
      await loadSubState();
    } else {
      subTip.value = res?.message || '操作未成功，请重试';
    }
  } catch {
    subTip.value = '收藏失败，请检查登录态';
  } finally {
    subLoading.value = false;
  }
};

// 订阅 MV 详情 / 地址 / 评论状态，immediate 保证首屏同步到当前值
watch(mvPlayer.mvDetailResult$, (v) => (mvDetail.value = v), { immediate: true });
watch(mvPlayer.mvUrlResult$, (v) => (url.value = v), { immediate: true });
watch(mvPlayer.mvCommentResult$, (v) => (commentRes.value = v), { immediate: true });

onMounted(() => {
  runMvStat();
  loadSubState();
});
</script>

<style scoped lang="less">
.mv-player {
  .mp-container {
    overflow: hidden;
    background: #262626;

    min-width: 1180px;
    max-width: 1640px;
    padding-bottom: 24px;
    margin: 0 auto;

    video {
      width: 100%;
    }

    .mp-info {
      display: flex;
      flex-direction: row;
      align-items: center;

      padding: 24px 24px 8px;
      color: hsla(0, 0%, 100%, 0.8);
      font-weight: 300;

      span {
        font-size: 16px;
        margin: 0 8px;
      }

      h5 {
        font-size: 24px;
        color: hsla(0, 0%, 100%, 0.6);
        font-weight: 600;
      }
    }

    .mp-data {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 24px;

      .iconfont {
        margin-right: 6px;
      }

      span,
      .iconfont {
        color: hsla(0, 0%, 100%, 0.6);
        font-size: 14px;
      }

      .mp-data--stat {
        margin-left: 16px;
      }

      .mp-data--sub-btn {
        margin-left: 20px;
        padding: 5px 16px;
        border: 1px solid var(--color-primary, #c20c0c);
        border-radius: 16px;
        background: var(--color-primary, #c20c0c);
        color: #fff;
        font-size: 13px;
        cursor: pointer;

        &.subed {
          background: transparent;
          color: #fff;
          border-color: hsla(0, 0%, 100%, 0.5);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .mp-data--tip {
        margin-left: 10px;
        font-size: 12px;
        color: hsla(0, 0%, 100%, 0.5);
      }
    }
  }

  .mp-comment {
    &-header {
      display: flex;
      align-items: flex-end;

      h5 {
        font-size: 22px;
        line-height: 30px;
        font-weight: 600;
      }

      span {
        margin-left: 8px;
        font-weight: 300;
        font-size: 14px;
      }
    }
  }
}
</style>
