/*
 * @Description: 首页区块瀑布流（homepage_block_page）
 * @Author: home-recommendation
 */
import { defineComponent, toRef } from 'vue';

import portal from '../services/portal.service';
import { HomepageBlock, HomepageBlockResource } from '../services/portal-api';

export default defineComponent({
  name: 'PortalBlockPage',
  setup() {
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

    return {
      blockPageList,
      blockPageError,
      collectResources,
      blockTitle,
      resImage,
      resTitle,
      resId,
      linkToResource,
    };
  },
});
