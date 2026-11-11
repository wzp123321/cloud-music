<template>
<div class="portal-block-page">
  <cm-error v-if="blockPageError" :text="'区块瀑布流暂时不可用'"></cm-error>
  <template v-else>
    <section
      v-for="(block, bIndex) in visibleBlocks"
      :key="'block_' + bIndex"
      class="portal-block-page--section"
    >
      <cm-navbar v-if="blockTitle(block)" :title="blockTitle(block)" :has-load-more="false"></cm-navbar>
      <div class="portal-block-page--row">
        <div
          v-for="(res, rIndex) in visibleResources(block)"
          :key="'res_' + bIndex + '_' + rIndex"
          class="portal-block-page--card"
          @click="linkToResource(res)"
        >
          <cm-skeleton
            width="100%"
            :height="''"
            :image-url="resImage(res)"
            source-type="image"
            :border-radius="'6px'"
          ></cm-skeleton>
          <p class="title mt8" :title="resTitle(res)">{{ resTitle(res) }}</p>
        </div>
      </div>
    </section>
    <div v-if="hasMore" class="portal-block-page--more">
      <button type="button" class="portal-block-page--more-btn" @click="expanded = !expanded">
        {{ expanded ? '收起推荐区块' : `展开全部 ${populatedBlocks.length} 个推荐区块` }}
      </button>
    </div>
  </template>
</div>

</template>

<script setup lang="ts">

/*
 * @Description: 首页区块瀑布流（homepage_block_page）
 * @Author: home-recommendation
 */
import { toRef, ref, computed } from 'vue';

import { usePortal } from '../hooks/usePortal';
import { HomepageBlock, HomepageBlockResource } from '../../../apis/portal/portal-api';

const portal = usePortal();
defineOptions({ name: 'PortalBlockPage' });
const blockPageList = toRef(portal, 'blockPageList');
    const blockPageError = toRef(portal, 'blockPageError');

    // 归集区块内所有资源（兼容 creatives 嵌套与 resources 平铺）
    const collectResources = (block: HomepageBlock): HomepageBlockResource[] => {
      const fromCreatives = (block.creatives || []).flatMap((c) => c.resources || []);
      return [...fromCreatives, ...(block.resources || [])];
    };

    // 首屏只展开 3 个有内容的区块、每区块 5 张卡，其余由用户主动展开
    const VISIBLE_BLOCK_COUNT = 3;
    const MAX_CARDS_PER_BLOCK = 5;
    const expanded = ref<boolean>(false);
    // 上游会返回无资源的空区块，渲染出来只会留下一段空白
    const populatedBlocks = computed<HomepageBlock[]>(() =>
      blockPageList.value.filter((block) => collectResources(block).length > 0),
    );
    const hasMore = computed(() => populatedBlocks.value.length > VISIBLE_BLOCK_COUNT);
    const visibleBlocks = computed<HomepageBlock[]>(() =>
      expanded.value ? populatedBlocks.value : populatedBlocks.value.slice(0, VISIBLE_BLOCK_COUNT),
    );

    const visibleResources = (block: HomepageBlock): HomepageBlockResource[] =>
      collectResources(block).slice(0, MAX_CARDS_PER_BLOCK);

    const blockTitle = (block: HomepageBlock): string => {
      return block?.uiElement?.title?.title || '';
    };

    const resImage = (r: HomepageBlockResource): string => {
      return r?.uiElement?.image?.imageUrl || '';
    };
    const resTitle = (r: HomepageBlockResource): string => {
      return r?.uiElement?.mainTitle?.title || r?.uiElement?.subTitle?.title || '';
    };
    const resId = (r: HomepageBlockResource): number | string | undefined => {
      return r?.resourceId;
    };

    // 按资源类型跳转到对应详情页
    const linkToResource = (r: HomepageBlockResource) => {
      const type = (r?.resourceType || '').toString().toUpperCase();
      const id = resId(r);
      if (id == null) return;
      if (type.includes('PLAYLIST')) {
        portal.linkToPlaylist(id);
      } else if (type.includes('ALBUM')) {
        portal.linkToAlbum(id);
      } else if (type.includes('SONG')) {
        portal.linkToSong(id);
      } else if (type.includes('VIDEO') || type.includes('MV')) {
        portal.linkToMv(id);
      } else {
        // 兜底按 actionType 处理
        const action = (r?.action?.actionType || '').toString().toUpperCase();
        if (action.includes('PLAYLIST')) portal.linkToPlaylist(id);
        else if (action.includes('ALBUM')) portal.linkToAlbum(id);
        else if (action.includes('SONG')) portal.linkToSong(id);
        else if (action.includes('VIDEO') || action.includes('MV')) portal.linkToMv(id);
      }
    };

    ;
</script>

<style lang="less" scoped>
.portal-block-page {
  margin-top: 16px;
  background-color: var(--color-default);
  border-radius: 8px;

  &--section {
    padding: 16px 0;
  }

  // 与歌单/榜单统一：容器全宽 5 列等分，左右边缘严格对齐
  &--row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 20px;
    margin-top: 12px;
  }

  &--card {
    cursor: pointer;
    transition: transform 233ms;

    &:hover {
      transform: translateY(-4px);
    }

    :deep(.cm-skeleton) {
      aspect-ratio: 1 / 1;
    }

    .title {
      font-size: 13px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &--more {
    display: flex;
    justify-content: center;
    padding: 8px 0 16px;
  }

  &--more-btn {
    padding: 8px 28px;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    background: #fff;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    transition: color 233ms, border-color 233ms;

    &:hover {
      color: #333;
      border-color: #bbb;
    }
  }
}

</style>
