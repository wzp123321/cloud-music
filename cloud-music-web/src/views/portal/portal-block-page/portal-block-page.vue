<template>
<div class="portal-block-page">
  <cm-error v-if="blockPageError" :text="'区块瀑布流暂时不可用'"></cm-error>
  <template v-else>
    <section
      v-for="(block, bIndex) in blockPageList"
      :key="'block_' + bIndex"
      class="portal-block-page--section mb32"
    >
      <cm-navbar v-if="blockTitle(block)" :title="blockTitle(block)" :has-load-more="false"></cm-navbar>
      <div class="portal-block-page--row flex-row-justify-start flex-wrap">
        <div
          v-for="(res, rIndex) in collectResources(block)"
          :key="'res_' + bIndex + '_' + rIndex"
          class="portal-block-page--card"
          @click="linkToResource(res)"
        >
          <cm-skeleton
            width="100%"
            :height="'180px'"
            :image-url="resImage(res)"
            source-type="image"
            :border-radius="'6px'"
          ></cm-skeleton>
          <p class="title mt8" :title="resTitle(res)">{{ resTitle(res) }}</p>
        </div>
      </div>
    </section>
  </template>
</div>

</template>

<script setup lang="ts">

/*
 * @Description: 首页区块瀑布流（homepage_block_page）
 * @Author: home-recommendation
 */
import {  toRef } from 'vue';

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
  margin-top: 24px;
  background-color: var(--color-default);
  border-radius: 8px;
  padding: 8px;

  &--section {
    padding: 12px 0;
  }

  &--row {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-top: 16px;
  }

  &--card {
    width: 180px;
    cursor: pointer;
    transition: transform 233ms;

    &:hover {
      transform: translateY(-4px);
    }

    .title {
      font-size: 14px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

</style>
