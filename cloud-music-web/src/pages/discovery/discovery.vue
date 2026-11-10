<template>
  <div class="discovery">
    <cm-navbar :title="'个性化发现与风格分类'" :hasLoadMore="false"></cm-navbar>

    <p class="discovery--intro">
      共 21 个接口（任务 2.1~2.4），按 capability 分组切换，每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>（未登录时写操作与需登录只读接口会降级提示，不发请求）。
    </p>

    <!-- 详情型接口的参数来源：来自上游列表点击项，或页面手动输入 -->
    <div class="discovery--globals">
      <label class="discovery--global">
        <span>tagId（← style_list）</span>
        <input v-model.number="sel.tagId" type="number" placeholder="来自 style_list 点击项 / 手动输入" />
      </label>
      <label class="discovery--global">
        <span>sheetId（← sheet_list）</span>
        <input v-model.number="sel.sheetId" type="number" placeholder="来自 sheet_list 点击项 / 手动输入" />
      </label>
      <label class="discovery--global">
        <span>mlogId（← mlog_music_rcmd）</span>
        <input v-model.number="sel.mlogId" type="number" placeholder="来自 mlog 列表点击项 / 手动输入" />
      </label>
    </div>

    <div class="discovery--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['discovery--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="discovery--blocks">
      <section v-for="block in activeBlocks" :key="block.module" class="dblock">
        <header class="dblock--head">
          <span class="dblock--module">{{ block.module }}</span>
          <span class="dblock--title">{{ block.title }}</span>
          <span :class="['dblock--kind', 'kind-' + block.kind]">{{ kindLabel(block.kind) }}</span>
        </header>
        <p class="dblock--desc">{{ block.desc }}<code class="dblock--url">{{ block.url }}</code></p>

        <div class="dblock--controls">
          <input
            v-if="block.input"
            v-model="inputs[block.module]"
            class="dblock--input"
            :placeholder="block.input.label"
          />
          <button class="dblock--btn" @click="runBlock(block)">{{ btnLabel(block) }}</button>
          <span v-if="block.needs" class="dblock--chain">
            {{ block.needs }} ← {{ block.source }}，当前值：<b>{{ sel[block.needs] || '未选择' }}</b>
          </span>
          <span v-if="block.provides && block.provides.length" class="dblock--provides">
            点击列表项可提供 {{ block.provides.join(' / ') }}
          </span>
        </div>

        <div v-if="states[block.module].loading" class="dblock--loading">加载中…</div>
        <p v-if="states[block.module].tip" class="dblock--tip">{{ states[block.module].tip }}</p>

        <div v-if="states[block.module].cards.length" class="dblock--grid">
          <div
            v-for="(card, index) in states[block.module].cards"
            :key="block.module + '_' + index"
            class="dblock--card"
            @click="onCardClick(block, card)"
          >
            <cm-skeleton width="100%" :height="'120px'" :imageUrl="card.cover || ''" :borderRadius="'6px'"></cm-skeleton>
            <p class="dblock--card-title" :title="card.title">{{ card.title }}</p>
            <p class="dblock--card-sub">id: {{ card.id }} {{ card.subtitle }}</p>
          </div>
        </div>
        <cm-error
          v-else-if="states[block.module].loaded && !states[block.module].cards.length"
          :title="'请求完成，无列表数据（详见原始返回）'"
        ></cm-error>

        <details v-if="states[block.module].loaded" class="dblock--raw">
          <summary>原始返回（兼容 res.data / res.result / res.xxx）</summary>
          <pre>{{ pretty(states[block.module].raw) }}</pre>
        </details>
      </section>
    </div>

    <p class="discovery--foot">
      说明：列表接口点击卡片会把 id 写入上方全局参数，再点击详情型接口按钮即「列表点击带参再请求详情」。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { hasLogin as checkLogin } from '@/services/content-enhance.service';
import discoveryService from './discovery.service';

type BlockKind = 'read' | 'loginRead' | 'write';

interface Card {
  id: any;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

interface BlockState {
  loading: boolean;
  loaded: boolean;
  cards: Card[];
  raw: any;
  tip: string;
}

interface Block {
  module: string;
  title: string;
  desc: string;
  tab: string;
  kind: BlockKind;
  url: string;
  auto?: boolean;
  input?: { label: string; def?: string };
  provides?: string[];
  needs?: string;
  source?: string;
  params?: (sel: Record<string, any>, v: string) => Record<string, any>;
  run: (p: Record<string, any>) => Promise<any>;
}

const loggedIn = checkLogin();

const tabs: { code: string; name: string }[] = [
  { code: '2.1', name: '2.1 个性化推荐' },
  { code: '2.2', name: '2.2 风格分类' },
  { code: '2.3', name: '2.3 歌单·榜单·搜索' },
  { code: '2.4', name: '2.4 mlog 与话题' },
];

const activeTab = ref<string>('2.1');

/** 详情型接口的参数池：来自上游列表点击项，或页面手动输入 */
const sel = reactive<Record<string, any>>({ tagId: 0, sheetId: 0, mlogId: 0 });
/** 每个区块独立的输入框值（页面输入也是合法参数来源） */
const inputs = reactive<Record<string, string>>({});
/** 每个区块独立的请求结果 */
const states = reactive<Record<string, BlockState>>({});

// ---------- 返回数据归一化：兼容 res.data / res.result / res.xxx ----------

const LIST_KEYS = [
  'data', 'result', 'list', 'records', 'songs', 'albums', 'artists', 'playlists', 'products',
  'mvs', 'mv', 'djprogram', 'djPrograms', 'privateContent', 'topics', 'mlogs', 'content',
  'items', 'feeds', 'threads', 'comments', 'resources', 'dataList', 'songlist',
];

/** 在响应体（含 data / result / 任意嵌套）中找出第一个数组作为列表 */
function pickList(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  const seen = new Set<any>();
  const queue: any[] = [res];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);
    if (Array.isArray(cur)) return cur;
    for (const key of LIST_KEYS) {
      if (Array.isArray(cur[key])) return cur[key];
    }
    for (const key of Object.keys(cur)) {
      const child = cur[key];
      if (child && typeof child === 'object') queue.push(child);
    }
  }
  return [];
}

function pickId(raw: any, index: number): any {
  const r = raw ?? {};
  return (
    r.id ?? r.tagId ?? r.sheetId ?? r.songId ?? r.rid ?? r.vid ?? r.mvid ?? r.userId ??
    r.programId ?? r.mlogId ?? r.resourceId ?? r.topicId ?? r.actid ?? r.cateId ??
    r.artistId ?? r.albumId ?? r.playlistId ?? r.targetId ?? index
  );
}

function pickTitle(raw: any, index: number): string {
  const r = raw ?? {};
  const t =
    r.name ?? r.title ?? r.nickname ?? r.songName ?? r.albumName ?? r.playlistName ??
    r.tagName ?? r.desc ?? r.content ?? r.text ?? r.message ?? r.titleName;
  return String(t ?? `条目 ${index + 1}`);
}

function pickCover(raw: any): string {
  const r = raw ?? {};
  return String(
    r.cover ?? r.coverUrl ?? r.picUrl ?? r.imgurl ?? r.img1v1Url ?? r.imageUrl ??
    r.avatarUrl ?? r.coverImgUrl ?? r.blurPicUrl ?? r.avatar ?? r.al?.picUrl ??
    r.album?.picUrl ?? '',
  );
}

function pickSubtitle(raw: any): string {
  const r = raw ?? {};
  const artist =
    r.artistName ?? r.creator?.nickname ?? r.user?.nickname ?? r.dj?.nickname ??
    r.ar?.[0]?.name ?? r.artists?.[0]?.name ?? r.artist?.name ?? '';
  const play = r.playCount ?? r.playcount ?? r.playCnt;
  const extra = r.subtitle ?? r.briefDesc ?? r.description ?? r.reason;
  const parts = [artist, play ? `播放 ${play}` : '', extra].filter(Boolean);
  return parts.join(' · ').slice(0, 80);
}

/** 统一归一为 { id, title, cover, subtitle } 再渲染 */
function normalize(res: any): Card[] {
  return pickList(res)
    .slice(0, 30)
    .map((raw, index) => ({
      id: pickId(raw, index),
      title: pickTitle(raw, index),
      cover: pickCover(raw),
      subtitle: pickSubtitle(raw),
      raw,
    }));
}

function pretty(raw: any): string {
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

function kindLabel(kind: BlockKind): string {
  return kind === 'write' ? '写操作' : kind === 'loginRead' ? '需登录只读' : '读取';
}

function btnLabel(block: Block): string {
  return block.kind === 'write' ? '执行（需登录 + 二次确认）' : block.kind === 'loginRead' ? '加载（需登录）' : '请求接口';
}

// ---------- 21 个接口 → 21 个真实调用点区块 ----------
// 详情型接口参数来源：style_* 的 tagId ← style_list；sheet_preview 的 id ← sheet_list；
// mlog_url / mlog_to_video 的 id ← mlog_music_rcmd；cloudsearch 的 keywords ← 页面输入。

const tagInput = { label: 'tagId（默认取 style_list 选中项，可手动输入）', def: '' };
const tagParams = (s: Record<string, any>, v: string): Record<string, any> => ({
  tagId: Number(v) || s.tagId || 0,
  limit: 20,
});

const blocks: Block[] = [
  // 2.1 个性化推荐（4）
  {
    module: 'personalized_djprogram', title: '个性化播客节目', desc: '推荐电台节目列表', tab: '2.1',
    kind: 'read', url: '/personalized/djprogram', auto: true,
    run: discoveryService.getPersonalizedDjprogram,
  },
  {
    module: 'personalized_mv', title: '个性化 MV', desc: '推荐 MV 列表', tab: '2.1',
    kind: 'read', url: '/personalized/mv', auto: true,
    run: discoveryService.getPersonalizedMv,
  },
  {
    module: 'personalized_privatecontent', title: '独家内容', desc: '独家放送内容', tab: '2.1',
    kind: 'read', url: '/personalized/privatecontent',
    run: discoveryService.getPersonalizedPrivatecontent,
  },
  {
    module: 'personalized_privatecontent_list', title: '独家内容列表', desc: '独家内容分页列表', tab: '2.1',
    kind: 'read', url: '/personalized/privatecontent/list',
    input: { label: '每页条数', def: '10' },
    params: (_s, v) => ({ limit: Number(v) || 10, offset: 0 }),
    run: discoveryService.getPersonalizedPrivatecontentList,
  },

  // 2.2 风格分类（7）
  {
    module: 'style_list', title: '风格标签列表', desc: '返回可用风格标签，点击列表项把 tagId 传给下游 5 个风格接口', tab: '2.2',
    kind: 'read', url: '/style/list', auto: true, provides: ['tagId'],
    run: discoveryService.getStyleList,
  },
  {
    module: 'style_detail', title: '风格详情', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/detail', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleDetail,
  },
  {
    module: 'style_album', title: '风格专辑', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/album', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleAlbum,
  },
  {
    module: 'style_artist', title: '风格歌手', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/artist', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleArtist,
  },
  {
    module: 'style_playlist', title: '风格歌单', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/playlist', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStylePlaylist,
  },
  {
    module: 'style_song', title: '风格歌曲', desc: 'tagId 来自 style_list', tab: '2.2',
    kind: 'read', url: '/style/song', needs: 'tagId', source: 'style_list', input: tagInput,
    params: tagParams,
    run: discoveryService.getStyleSong,
  },
  {
    module: 'style_preference', title: '风格偏好', desc: '用户风格偏好标签（可选带上 tagId）', tab: '2.2',
    kind: 'read', url: '/style/preference',
    params: (s) => (s.tagId ? { tagId: s.tagId } : {}),
    run: discoveryService.getStylePreference,
  },

  // 2.3 歌单页 / 榜单 / 云搜索（5）
  {
    module: 'sheet_list', title: '歌单页列表', desc: '歌单列表，点击列表项把 sheetId 传给 sheet_preview', tab: '2.3',
    kind: 'read', url: '/sheet/list', auto: true, provides: ['sheetId'],
    input: { label: '分类（可选，如「华语」）', def: '' },
    params: (_s, v) => ({ ...(v ? { cat: v } : {}), limit: 20, offset: 0 }),
    run: discoveryService.getSheetList,
  },
  {
    module: 'sheet_preview', title: '歌单预览', desc: 'id 来自 sheet_list', tab: '2.3',
    kind: 'read', url: '/sheet/preview', needs: 'sheetId', source: 'sheet_list',
    input: { label: '歌单 id（默认取 sheet_list 选中项，可手动输入）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.sheetId || 0 }),
    run: discoveryService.getSheetPreview,
  },
  {
    module: 'toplist_artist', title: '歌手榜', desc: '歌手排行榜', tab: '2.3',
    kind: 'read', url: '/toplist/artist', auto: true,
    input: { label: '类型 1/2/3（可选）', def: '' },
    params: (_s, v) => (v ? { type: Number(v) } : {}),
    run: discoveryService.getToplistArtist,
  },
  {
    module: 'toplist_detail', title: '榜单详情', desc: '榜单详情（可输入榜单 id）', tab: '2.3',
    kind: 'read', url: '/toplist/detail',
    input: { label: '榜单 id（可选）', def: '' },
    params: (_s, v) => (v ? { id: Number(v) } : {}),
    run: discoveryService.getToplistDetail,
  },
  {
    module: 'cloudsearch', title: '云搜索', desc: 'keywords 来自页面输入框', tab: '2.3',
    kind: 'read', url: '/cloudsearch',
    input: { label: '搜索关键词', def: '周杰伦' },
    params: (_s, v) => ({ keywords: v || '周杰伦', type: 1, limit: 20 }),
    run: discoveryService.getCloudsearch,
  },

  // 2.4 mlog / 精选评论 / 热门话题（5）
  {
    module: 'mlog_music_rcmd', title: 'mlog 音乐推荐', desc: '点击列表项把 mlogId 传给 mlog_url / mlog_to_video', tab: '2.4',
    kind: 'read', url: '/mlog/music/rcmd', auto: true, provides: ['mlogId'],
    input: { label: '歌曲 id（可选）', def: '' },
    params: (_s, v) => (v ? { id: Number(v) } : {}),
    run: discoveryService.getMlogMusicRcmd,
  },
  {
    module: 'mlog_to_video', title: 'mlog 转视频', desc: 'id 来自 mlog_music_rcmd', tab: '2.4',
    kind: 'read', url: '/mlog/to/video', needs: 'mlogId', source: 'mlog_music_rcmd',
    input: { label: 'mlog id（默认取列表选中项，可手动输入）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.mlogId || 0 }),
    run: discoveryService.getMlogToVideo,
  },
  {
    module: 'mlog_url', title: 'mlog 播放地址', desc: 'id 来自 mlog_music_rcmd', tab: '2.4',
    kind: 'read', url: '/mlog/url', needs: 'mlogId', source: 'mlog_music_rcmd',
    input: { label: 'mlog id（默认取列表选中项，可手动输入）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.mlogId || 0 }),
    run: discoveryService.getMlogUrl,
  },
  {
    module: 'starpick_comments_summary', title: '精选评论摘要', desc: '精选评论摘要（可输入资源 id）', tab: '2.4',
    kind: 'read', url: '/starpick/comments/summary',
    input: { label: '资源 id（可选）', def: '' },
    params: (_s, v) => (v ? { id: Number(v) } : {}),
    run: discoveryService.getStarpickCommentsSummary,
  },
  {
    module: 'hot_topic', title: '热门话题', desc: '热门话题（需登录只读，未登录降级不发请求）', tab: '2.4',
    kind: 'loginRead', url: '/hot/topic',
    input: { label: '条数', def: '10' },
    params: (_s, v) => ({ limit: Number(v) || 10 }),
    run: discoveryService.getHotTopic,
  },
];

// 初始化每个区块的状态与输入默认值
blocks.forEach((block) => {
  states[block.module] = { loading: false, loaded: false, cards: [], raw: null, tip: '' };
  if (block.input) inputs[block.module] = block.input.def ?? '';
});

const activeBlocks = computed(() => blocks.filter((block) => block.tab === activeTab.value));

/** 执行一个区块的接口调用：登录降级 / 写操作二次确认 / try-catch 空值 / 归一化 */
async function runBlock(block: Block): Promise<void> {
  const st = states[block.module];
  if (!st || st.loading) return;

  // 需登录只读 / 写操作：未登录降级，不发请求
  if ((block.kind === 'write' || block.kind === 'loginRead') && !checkLogin()) {
    st.tip = '登录后可用（未登录，已降级，未发送请求）';
    return;
  }

  const inputVal = inputs[block.module] ?? '';
  const params: Record<string, any> = block.params ? block.params(sel, inputVal) || {} : {};

  st.loading = true;
  st.loaded = true;
  st.tip = '';
  try {
    const res = await block.run(params);
    st.raw = res ?? {};
    st.cards = normalize(res);
    // 上游列表接口：自动把首项 id 写入参数池，供下游详情接口带参
    if (block.provides && block.provides.length && st.cards.length) {
      const id = st.cards[0].id;
      block.provides.forEach((key) => {
        sel[key] = id;
      });
    }
    if (!st.cards.length) {
      st.tip = '请求完成（非列表返回，详见原始返回）';
    } else if (block.provides && block.provides.length) {
      st.tip = `已加载 ${st.cards.length} 项；点击列表项可把 id 传给下游详情接口`;
    }
  } catch {
    st.cards = [];
    st.raw = {};
    st.tip = '请求失败，已降级为空值';
  } finally {
    st.loading = false;
  }
}

/** 列表点击带参：把上游返回项的 id 写入参数池 */
function onCardClick(block: Block, card: Card): void {
  if (!block.provides || !block.provides.length) return;
  block.provides.forEach((key) => {
    sel[key] = card.id;
  });
  states[block.module].tip = `已选中 id=${card.id}（${block.provides.join(' / ')}），现在可点击下游详情接口按钮带参请求`;
}

/** 切换到某分组时，仅自动加载该分组的读取型「来源列表」区块（绝不自动调用写操作 / 需登录接口） */
function loadAutoTab(code: string): void {
  blocks
    .filter((block) => block.tab === code && block.auto && block.kind === 'read')
    .forEach((block) => runBlock(block));
}

function switchTab(code: string): void {
  if (activeTab.value === code) return;
  activeTab.value = code;
  loadAutoTab(code);
}

onMounted(() => {
  loadAutoTab(activeTab.value);
});
</script>

<style scoped lang="less">
.discovery {
  width: 1400px;
  margin: 0 auto;
  padding: 24px 0 48px;

  &--intro {
    margin-top: 20px;
    font-size: 13px;
    line-height: 1.8;
    color: #888;

    b {
      color: var(--color-primary, #c20c0c);
    }
  }

  &--globals {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
    padding: 14px 18px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--global {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;

    input {
      width: 240px;
      padding: 6px 10px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      font-size: 13px;
      outline: none;
    }
  }

  &--tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  &--tab {
    padding: 8px 18px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 18px;
    background: var(--color-default, #fff);
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &.active {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
      background: rgba(194, 12, 12, 0.06);
    }
  }

  &--blocks {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 24px;
  }

  &--foot {
    margin-top: 32px;
    font-size: 12px;
    color: #aaa;
  }
}

.dblock {
  padding: 16px 20px;
  background: var(--color-default, #fff);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &--head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  &--module {
    padding: 2px 10px;
    border-radius: 4px;
    background: rgba(194, 12, 12, 0.08);
    color: var(--color-primary, #c20c0c);
    font-family: monospace;
    font-size: 12px;
  }

  &--title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  &--kind {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    color: #666;
    background: rgba(0, 0, 0, 0.05);

    &.kind-loginRead {
      color: #b8860b;
      background: rgba(184, 134, 11, 0.12);
    }

    &.kind-write {
      color: #c20c0c;
      background: rgba(194, 12, 12, 0.12);
    }
  }

  &--desc {
    margin-top: 8px;
    font-size: 13px;
    color: #999;
  }

  &--url {
    margin-left: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.04);
    font-family: monospace;
    font-size: 12px;
    color: #666;
  }

  &--controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }

  &--input {
    width: 300px;
    padding: 7px 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    font-size: 13px;
    outline: none;
  }

  &--btn {
    padding: 7px 18px;
    border: none;
    border-radius: 6px;
    background: var(--color-primary, #c20c0c);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  }

  &--chain,
  &--provides {
    font-size: 12px;
    color: #999;

    b {
      color: var(--color-primary, #c20c0c);
    }
  }

  &--loading,
  &--tip {
    margin-top: 14px;
    font-size: 13px;
    color: #999;
  }

  &--tip {
    color: #6a9955;
  }

  &--grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 18px;
    margin-top: 16px;
  }

  &--card {
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-4px);
    }
  }

  &--card-title {
    margin-top: 8px;
    font-size: 13px;
    color: #333;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--card-sub {
    margin-top: 4px;
    font-size: 11px;
    color: #999;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--raw {
    margin-top: 14px;
    font-size: 12px;

    summary {
      cursor: pointer;
      color: #888;
    }

    pre {
      max-height: 260px;
      overflow: auto;
      padding: 12px;
      margin-top: 8px;
      border-radius: 6px;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}
</style>
