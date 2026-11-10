<template>
  <div class="pi">
    <cm-navbar :title="'歌曲互动与播放记录'" :hasLoadMore="false"></cm-navbar>

    <p class="pi--intro">
      共 23 个接口（任务 3.1~3.5），按 capability 分组切换，每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>（写操作需登录 + 二次确认；需登录只读接口未登录降级不发请求）。
      特殊路由：<code>personal_fm → /personal_fm</code>、<code>fm_trash → /fm_trash</code>。
    </p>

    <!-- 详情型接口的参数来源：来自歌曲列表点击项，或页面手动输入 -->
    <div class="pi--globals">
      <label class="pi--global">
        <span>当前歌曲 ID（song_* / check_music / lyric_new 等的 id 来源）</span>
        <input v-model.number="sel.songId" type="number" placeholder="来自歌曲列表点击项 / 手动输入" />
      </label>
      <label class="pi--global">
        <span>历史推荐 id（← history_recommend_songs）</span>
        <input v-model.number="sel.historyId" type="number" placeholder="来自 history_recommend_songs 点击项 / 手动输入" />
      </label>
      <label class="pi--global">
        <span>歌单 pid（可选，用于智能播放 / scrobble）</span>
        <input v-model.number="sel.pid" type="number" placeholder="可选" />
      </label>
    </div>

    <div class="pi--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['pi--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="pi--blocks">
      <section v-for="block in activeBlocks" :key="block.module" class="pblock">
        <header class="pblock--head">
          <span class="pblock--module">{{ block.module }}</span>
          <span class="pblock--title">{{ block.title }}</span>
          <span :class="['pblock--kind', 'kind-' + block.kind]">{{ kindLabel(block.kind) }}</span>
        </header>
        <p class="pblock--desc">{{ block.desc }}<code class="pblock--url">{{ block.url }}</code></p>

        <div class="pblock--controls">
          <input
            v-if="block.input"
            v-model="inputs[block.module]"
            class="pblock--input"
            :placeholder="block.input.label"
          />
          <button class="pblock--btn" @click="runBlock(block)">{{ btnLabel(block) }}</button>
          <span v-if="block.needs" class="pblock--chain">
            {{ block.needs }} ← {{ block.source }}，当前值：<b>{{ sel[block.needs] || '未选择' }}</b>
          </span>
          <span v-if="block.provides && block.provides.length" class="pblock--provides">
            点击列表项可提供 {{ block.provides.join(' / ') }}
          </span>
        </div>

        <div v-if="states[block.module].loading" class="pblock--loading">加载中…</div>
        <p v-if="states[block.module].tip" class="pblock--tip">{{ states[block.module].tip }}</p>

        <div v-if="states[block.module].cards.length" class="pblock--grid">
          <div
            v-for="(card, index) in states[block.module].cards"
            :key="block.module + '_' + index"
            class="pblock--card"
            @click="onCardClick(block, card)"
          >
            <cm-skeleton width="100%" :height="'110px'" :imageUrl="card.cover || ''" :borderRadius="'6px'"></cm-skeleton>
            <p class="pblock--card-title" :title="card.title">{{ card.title }}</p>
            <p class="pblock--card-sub">id: {{ card.id }} {{ card.subtitle }}</p>
          </div>
        </div>
        <cm-error
          v-else-if="states[block.module].loaded && !states[block.module].cards.length"
          :title="'请求完成，无列表数据（详见原始返回）'"
        ></cm-error>

        <details v-if="states[block.module].loaded" class="pblock--raw">
          <summary>原始返回（兼容 res.data / res.result / res.xxx）</summary>
          <pre>{{ pretty(states[block.module].raw) }}</pre>
        </details>
      </section>
    </div>

    <p class="pi--foot">
      说明：写操作按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求，且绝不在 onMounted 自动触发；
      需登录只读接口未登录时仅提示、不发请求。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { hasLogin as checkLogin } from '@/services/content-enhance.service';
import playInteractionService from './play-interaction.service';

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
  confirmMsg?: string;
  params?: (sel: Record<string, any>, v: string) => Record<string, any>;
  run: (p: Record<string, any>) => Promise<any>;
}

const loggedIn = checkLogin();

const tabs: { code: string; name: string }[] = [
  { code: '3.1', name: '3.1 红心与喜欢' },
  { code: '3.2', name: '3.2 私人 FM' },
  { code: '3.3', name: '3.3 智能播放与排序' },
  { code: '3.4', name: '3.4 歌曲信息与校验' },
  { code: '3.5', name: '3.5 播放记录与历史推荐' },
];

const activeTab = ref<string>('3.1');

/** 详情型接口的参数池：来自歌曲列表点击项，或页面手动输入 */
const sel = reactive<Record<string, any>>({ songId: 0, historyId: 0, pid: 0 });
/** 每个区块独立的输入框值（页面输入也是合法参数来源） */
const inputs = reactive<Record<string, string>>({});
/** 每个区块独立的请求结果 */
const states = reactive<Record<string, BlockState>>({});

// ---------- 返回数据归一化：兼容 res.data / res.result / res.xxx ----------

const LIST_KEYS = [
  'data', 'result', 'list', 'records', 'songs', 'albums', 'artists', 'playlists', 'products',
  'mvs', 'mv', 'djprogram', 'djPrograms', 'topics', 'content', 'items', 'feeds', 'threads',
  'comments', 'resources', 'dataList', 'songlist', 'playRecordList', 'weekData', 'allData',
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
    r.id ?? r.songId ?? r.rid ?? r.vid ?? r.mvid ?? r.userId ?? r.programId ??
    r.resourceId ?? r.topicId ?? r.actid ?? r.artistId ?? r.albumId ?? r.playlistId ??
    r.targetId ?? r.data?.id ?? r.song?.id ?? index
  );
}

function pickTitle(raw: any, index: number): string {
  const r = raw ?? {};
  const t =
    r.name ?? r.title ?? r.nickname ?? r.songName ?? r.albumName ?? r.playlistName ??
    r.desc ?? r.content ?? r.text ?? r.message ?? r.song?.name ?? r.data?.name;
  return String(t ?? `条目 ${index + 1}`);
}

function pickCover(raw: any): string {
  const r = raw ?? {};
  return String(
    r.cover ?? r.coverUrl ?? r.picUrl ?? r.imgurl ?? r.img1v1Url ?? r.imageUrl ??
    r.avatarUrl ?? r.coverImgUrl ?? r.blurPicUrl ?? r.avatar ?? r.al?.picUrl ??
    r.album?.picUrl ?? r.song?.al?.picUrl ?? '',
  );
}

function pickSubtitle(raw: any): string {
  const r = raw ?? {};
  const artist =
    r.artistName ?? r.creator?.nickname ?? r.user?.nickname ?? r.dj?.nickname ??
    r.ar?.[0]?.name ?? r.artists?.[0]?.name ?? r.artist?.name ?? r.song?.ar?.[0]?.name ?? '';
  const play = r.playCount ?? r.playcount ?? r.playCnt;
  const extra = r.subtitle ?? r.briefDesc ?? r.description ?? r.reason ?? r.playTime;
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

// ---------- 23 个接口 → 23 个真实调用点区块 ----------
// 写操作：like / resource_like / fm_trash / song_order_update / scrobble
//   未登录用 hasLogin() 降级；点击需 window.confirm 二次确认；禁止 onMounted 自动调用。
// 需登录只读：likelist / song_purchased / record_recent_* / history_recommend_*，未登录降级。
// 详情参数来源：song_* / check_music / lyric_new 的 id ← 歌曲列表或页面输入；
//   history_recommend_songs_detail 的 id ← history_recommend_songs。

const songInput = { label: '歌曲 id（默认取上方「当前歌曲 ID」，可手动输入）', def: '' };
const songParams = (s: Record<string, any>, v: string): Record<string, any> => ({
  id: Number(v) || s.songId || 0,
});

const blocks: Block[] = [
  // 3.1 红心与喜欢列表（3）
  {
    module: 'like', title: '红心歌曲', desc: '对歌曲红心（写操作，id 来自歌曲列表/输入）', tab: '3.1',
    kind: 'write', url: '/like', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: (s, v) => ({ id: Number(v) || s.songId || 0, like: true }),
    confirmMsg: '确认把该歌曲加入红心吗？',
    run: playInteractionService.setLike,
  },
  {
    module: 'likelist', title: '喜欢列表', desc: '我喜欢的歌曲（需登录只读，点击列表项可提供歌曲 id）', tab: '3.1',
    kind: 'loginRead', url: '/likelist', provides: ['songId'],
    input: { label: '用户 uid（可选）', def: '' },
    params: (_s, v) => (v ? { uid: Number(v) } : {}),
    run: playInteractionService.getLikelist,
  },
  {
    module: 'resource_like', title: '资源点赞', desc: '资源点赞/取消（写操作，id 来自资源列表/输入）', tab: '3.1',
    kind: 'write', url: '/resource/like',
    input: { label: '资源 id（默认取当前歌曲 ID）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.songId || 0, t: 1, type: 1 }),
    confirmMsg: '确认提交该资源的点赞操作吗？',
    run: playInteractionService.setResourceLike,
  },

  // 3.2 私人 FM（2，特殊路由）
  {
    module: 'personal_fm', title: '私人 FM', desc: '私人 FM 推荐歌曲（特殊路由 /personal_fm，点击列表项可提供歌曲 id）', tab: '3.2',
    kind: 'read', url: '/personal_fm', auto: true, provides: ['songId'],
    run: playInteractionService.getPersonalFm,
  },
  {
    module: 'fm_trash', title: 'FM 垃圾桶', desc: '把歌曲移出 FM 推荐（写操作，特殊路由 /fm_trash）', tab: '3.2',
    kind: 'write', url: '/fm_trash', needs: 'songId', source: 'personal_fm 列表 / 手动输入',
    input: songInput,
    params: songParams,
    confirmMsg: '确认把该歌曲移出私人 FM 推荐吗？',
    run: playInteractionService.setFmTrash,
  },

  // 3.3 智能播放与排序（3）
  {
    module: 'playmode_intelligence_list', title: '智能播放列表', desc: '基于歌曲生成接续歌曲，点击列表项可提供歌曲 id', tab: '3.3',
    kind: 'read', url: '/playmode/intelligence/list', auto: true, provides: ['songId'],
    input: { label: '歌曲 id（可选）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.songId || 0, ...(s.pid ? { pid: s.pid } : {}) }),
    run: playInteractionService.getPlaymodeIntelligenceList,
  },
  {
    module: 'playmode_song_vector', title: '歌曲向量', desc: '歌曲特征向量（id 来自歌曲列表/输入）', tab: '3.3',
    kind: 'read', url: '/playmode/song/vector', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: songParams,
    run: playInteractionService.getPlaymodeSongVector,
  },
  {
    module: 'song_order_update', title: '手动排序', desc: '更新歌曲顺序（写操作，ids 来自页面输入）', tab: '3.3',
    kind: 'write', url: '/song/order/update',
    input: { label: '歌曲 id 列表（逗号分隔）', def: '' },
    params: (s, v) => ({ ids: v || String(s.songId || 0), ...(s.pid ? { pid: s.pid } : {}) }),
    confirmMsg: '确认提交新的歌曲顺序吗？',
    run: playInteractionService.setSongOrderUpdate,
  },

  // 3.4 歌曲信息与可用性校验（7）
  {
    module: 'song_url_v1', title: '歌曲播放地址', desc: 'id 来自歌曲列表/输入', tab: '3.4',
    kind: 'read', url: '/song/url/v1', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: (s, v) => ({ id: Number(v) || s.songId || 0, level: 'standard' }),
    run: playInteractionService.getSongUrlV1,
  },
  {
    module: 'song_purchased', title: '已购歌曲', desc: '已购买歌曲列表（需登录只读，点击列表项可提供歌曲 id）', tab: '3.4',
    kind: 'loginRead', url: '/song/purchased', provides: ['songId'],
    params: () => ({}),
    run: playInteractionService.getSongPurchased,
  },
  {
    module: 'song_wiki_summary', title: '歌曲百科摘要', desc: 'id 来自歌曲列表/输入', tab: '3.4',
    kind: 'read', url: '/song/wiki/summary', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: songParams,
    run: playInteractionService.getSongWikiSummary,
  },
  {
    module: 'check_music', title: '校验歌曲可用', desc: '校验版权可用性（id 来自歌曲列表/输入）', tab: '3.4',
    kind: 'read', url: '/check/music', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: songParams,
    run: playInteractionService.getCheckMusic,
  },
  {
    module: 'lyric_new', title: '新版歌词', desc: 'id 来自歌曲列表/输入', tab: '3.4',
    kind: 'read', url: '/lyric/new', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: songParams,
    run: playInteractionService.getLyricNew,
  },
  {
    module: 'music_first_listen_info', title: '首次收听信息', desc: 'id 来自歌曲列表/输入', tab: '3.4',
    kind: 'read', url: '/music/first/listen/info', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: songParams,
    run: playInteractionService.getMusicFirstListenInfo,
  },
  {
    module: 'scrobble', title: '播放记录上报', desc: '上报听歌记录（写操作，id 来自歌曲列表/输入）', tab: '3.4',
    kind: 'write', url: '/scrobble', needs: 'songId', source: '歌曲列表 / 手动输入',
    input: songInput,
    params: (s, v) => ({ id: Number(v) || s.songId || 0, sourceid: s.pid || 0, time: 0 }),
    confirmMsg: '确认上报该歌曲的播放记录吗？',
    run: playInteractionService.setScrobble,
  },

  // 3.5 播放记录与历史推荐（8）
  {
    module: 'record_recent_song', title: '最近播放歌曲', desc: '需登录只读，点击列表项可提供歌曲 id', tab: '3.5',
    kind: 'loginRead', url: '/record/recent/song', provides: ['songId'],
    params: () => ({}),
    run: playInteractionService.getRecordRecentSong,
  },
  {
    module: 'record_recent_album', title: '最近播放专辑', desc: '需登录只读', tab: '3.5',
    kind: 'loginRead', url: '/record/recent/album',
    run: playInteractionService.getRecordRecentAlbum,
  },
  {
    module: 'record_recent_playlist', title: '最近播放歌单', desc: '需登录只读', tab: '3.5',
    kind: 'loginRead', url: '/record/recent/playlist',
    run: playInteractionService.getRecordRecentPlaylist,
  },
  {
    module: 'record_recent_video', title: '最近播放视频', desc: '需登录只读', tab: '3.5',
    kind: 'loginRead', url: '/record/recent/video',
    run: playInteractionService.getRecordRecentVideo,
  },
  {
    module: 'record_recent_dj', title: '最近播放电台', desc: '需登录只读', tab: '3.5',
    kind: 'loginRead', url: '/record/recent/dj',
    run: playInteractionService.getRecordRecentDj,
  },
  {
    module: 'record_recent_voice', title: '最近播放声音', desc: '需登录只读', tab: '3.5',
    kind: 'loginRead', url: '/record/recent/voice',
    run: playInteractionService.getRecordRecentVoice,
  },
  {
    module: 'history_recommend_songs', title: '历史推荐歌曲', desc: '需登录只读，点击列表项把 id 传给 history_recommend_songs_detail', tab: '3.5',
    kind: 'loginRead', url: '/history/recommend/songs', provides: ['songId', 'historyId'],
    params: () => ({}),
    run: playInteractionService.getHistoryRecommendSongs,
  },
  {
    module: 'history_recommend_songs_detail', title: '历史推荐歌曲详情', desc: '需登录只读，id 来自 history_recommend_songs', tab: '3.5',
    kind: 'loginRead', url: '/history/recommend/songs/detail', needs: 'historyId', source: 'history_recommend_songs',
    input: { label: 'id（默认取历史推荐列表选中项，可手动输入）', def: '' },
    params: (s, v) => ({ id: Number(v) || s.historyId || 0 }),
    run: playInteractionService.getHistoryRecommendSongsDetail,
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
  // 写操作：用户点击后必须 window.confirm 二次确认，确认后才调用
  if (block.kind === 'write') {
    const ok = window.confirm(block.confirmMsg || `确认执行写操作【${block.title}｜${block.module}】吗？`);
    if (!ok) {
      st.tip = '已取消，未发送请求';
      return;
    }
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
      st.tip = block.kind === 'write' ? '写操作已提交（无列表返回，详见原始返回）' : '请求完成（非列表返回，详见原始返回）';
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
  // 只加载读取型来源列表，用于给歌曲详情接口预填 songId；写操作 / 需登录接口绝不自动触发
  const fm = blocks.find((block) => block.module === 'personal_fm');
  if (fm) runBlock(fm);
  loadAutoTab(activeTab.value);
});
</script>

<style scoped lang="less">
.pi {
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

    code {
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.04);
      font-family: monospace;
      color: #666;
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
      width: 220px;
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
    line-height: 1.8;
    color: #aaa;
  }
}

.pblock {
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
    width: 320px;
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
