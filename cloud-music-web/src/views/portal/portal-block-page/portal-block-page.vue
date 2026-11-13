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
      <div class="portal-block-page--row grid-cols-5">
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
      <cm-button type="button" class="portal-block-page--more-btn" @click="expanded = !expanded">
        {{ expanded ? '收起推荐区块' : `展开全部 ${populatedBlocks.length} 个推荐区块` }}
      </cm-button>
    </div>
  </template>
</div>

</template>

<script setup lang="ts">

// 首页区块瀑布流（homepage_block_page）
import { toRef, ref, computed } from 'vue';

import router from '@/router';
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

    // 可导航的资源类型：均对应前端已存在的详情/列表页（server 也都有对应接口）。
    // VOICE（播客节目）→ 节目详情；VOICELIST/RADIO/DJ（电台）→ 电台详情。
    // 其余类型（话题 / 活动等暂无详情页）一律不渲染卡片，避免「点了没反应」
    const NAVIGABLE_TYPE =
      /PLAYLIST|LIST|ALBUM|SONG|VIDEO|MV|ARTIST|SINGER|USER|RADIO|DJ|VOICELIST|VOICE|TOPLIST/;
    const isExternalUrl = (s?: string): boolean => !!s && /^https?:\/\//i.test(s);

    const resId = (r: HomepageBlockResource): number | string | undefined => r?.resourceId;

    // 该资源是否可跳转（决定卡片是否渲染）
    const canNavigate = (r: HomepageBlockResource): boolean => {
      if (resId(r) == null) return false;
      const type = (r?.resourceType || '').toString().toUpperCase();
      const action = (r?.action?.actionType || '').toString().toUpperCase();
      if (NAVIGABLE_TYPE.test(type) || NAVIGABLE_TYPE.test(action)) return true;
      // 外链（resourceUrl 或 action 里的网页地址）也能在新标签打开
      if (isExternalUrl(r?.resourceUrl) || isExternalUrl(r?.action?.actionType)) return true;
      return false;
    };

    const filterNavigable = (list: HomepageBlockResource[]): HomepageBlockResource[] =>
      list.filter(canNavigate);

    // 首屏只展开 3 个有内容的区块、每区块 5 张卡，其余由用户主动展开
    const VISIBLE_BLOCK_COUNT = 3;
    const MAX_CARDS_PER_BLOCK = 5;
    const expanded = ref<boolean>(false);
    // 上游会返回「无资源」或「资源全部不可跳转」的空区块，渲染出来只会留下空白
    const populatedBlocks = computed<HomepageBlock[]>(() =>
      blockPageList.value.filter((block) => filterNavigable(collectResources(block)).length > 0),
    );
    const hasMore = computed(() => populatedBlocks.value.length > VISIBLE_BLOCK_COUNT);
    const visibleBlocks = computed<HomepageBlock[]>(() =>
      expanded.value ? populatedBlocks.value : populatedBlocks.value.slice(0, VISIBLE_BLOCK_COUNT),
    );

    const visibleResources = (block: HomepageBlock): HomepageBlockResource[] =>
      filterNavigable(collectResources(block)).slice(0, MAX_CARDS_PER_BLOCK);

    const blockTitle = (block: HomepageBlock): string => {
      return block?.uiElement?.title?.title || '';
    };

    const resImage = (r: HomepageBlockResource): string => {
      return r?.uiElement?.image?.imageUrl || '';
    };
    const resTitle = (r: HomepageBlockResource): string => {
      return r?.uiElement?.mainTitle?.title || r?.uiElement?.subTitle?.title || '';
    };

    // 按资源类型跳转到对应详情页（仅对 canNavigate 为 true 的资源调用）
    const linkToResource = (r: HomepageBlockResource) => {
      if (!canNavigate(r)) return;
      const id = resId(r) as number | string;
      const type = (r?.resourceType || '').toString().toUpperCase();
      const action = (r?.action?.actionType || '').toString().toUpperCase();
      if (/PLAYLIST|LIST/.test(type) || /PLAYLIST|LIST/.test(action)) return portal.linkToPlaylist(id);
      if (/ALBUM/.test(type)) return portal.linkToAlbum(id);
      if (/SONG/.test(type)) return portal.linkToSong(id);
      if (/VIDEO|MV/.test(type)) return portal.linkToMv(id);
      if (/ARTIST|SINGER/.test(type)) return portal.linkToArtistDetail(Number(id));
      if (/USER/.test(type) || /USER/.test(action)) {
        return router.push({ path: '/user', query: { id: String(id) } });
      }
      // 电台（VOICELIST / RADIO / DJ）→ 电台详情
      if (/RADIO|DJ|VOICELIST/.test(type) || /RADIO|DJ|VOICELIST/.test(action)) {
        return portal.linkToDjRadio(id);
      }
      // 播客节目（VOICE）→ 节目详情
      if (/VOICE/.test(type)) return portal.linkToDjProgram(id);
      // 榜单（TOPLIST）本质是一张歌单，统一走歌单详情页
      if (/TOPLIST/.test(type)) {
        return portal.linkToPlaylist(id);
      }
      // 外链：新标签打开
      const url = r?.resourceUrl || r?.action?.actionType;
      if (isExternalUrl(url)) return window.open(url, '_blank', 'noopener,noreferrer');
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
