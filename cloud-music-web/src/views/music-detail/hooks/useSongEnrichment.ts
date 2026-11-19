import { onScopeDispose, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';

import { highValueService } from '@/apis/server-coverage/high-value.service';
import {
  normalizeRedCount,
  normalizeWiki,
  type SongWikiVO,
} from '../api/song-enrichment.api';

/**
 * 歌曲百科与红心数：按当前歌曲 id 并发拉取，用请求序号拦截切歌后的过期响应。
 * service 已吞异常返回 null，归一化函数亦接受 null，故无需 try/catch，也不弹错。
 */
export const useSongEnrichment = (
  songId: ComputedRef<number>,
): {
  wiki: Ref<SongWikiVO>;
  redCount: Ref<number | null>;
  loading: Ref<boolean>;
} => {
  const wiki = ref<SongWikiVO>({ entries: [], summary: '' });
  const redCount = ref<number | null>(null);
  const loading = ref<boolean>(false);

  // 模块内请求序号：切歌后旧响应即使回来也不得覆盖新歌数据。
  let requestId = 0;
  // 组件卸载后让全部在途响应的序号校验失败，避免往已销毁作用域写值。
  let disposed = false;

  watch(
    songId,
    async (id) => {
      const mySeq = ++requestId;
      // 先清空旧值，避免切歌瞬间残留上一首的百科与红心数
      wiki.value = { entries: [], summary: '' };
      redCount.value = null;
      loading.value = true;

      const [wikiRes, redCountRes] = await Promise.all([
        highValueService.song.wiki(id),
        highValueService.song.redCount(id),
      ]);

      // 已有更新请求发出或作用域已销毁，丢弃本次响应
      if (disposed || mySeq !== requestId) return;

      wiki.value = normalizeWiki(wikiRes);
      redCount.value = normalizeRedCount(redCountRes);
      loading.value = false;
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
  });

  return { wiki, redCount, loading };
};
