<template>
  <div class="pg">
    <cm-navbar :title="'杂项长尾'" :hasLoadMore="false"></cm-navbar>

    <p class="pg--intro">
      共 9 个接口（任务 8.1），每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>。<code>inner_version</code> 为只读，应用启动即 onMounted 自动加载自检；
      <code>weblog</code> 为写操作，需登录 + <code>window.confirm</code> 二次确认，禁止 onMounted 自动调用；
      <code>calendar</code> 需登录只读、未登录降级，时间参数用 <code>new Date()</code> 生成（不硬编码）；
      <code>pl_count</code> 业务异常属「待核不进主路径」，仅手动点击触发、不自动加载。
    </p>

    <div class="pg--globals" v-if="selKeys.length">
      <label v-for="key in selKeys" :key="key" class="pg--global">
        <span>参数池 {{ key }}（来自上游列表点击项 / 手动输入）</span>
        <input v-model="sel[key]" type="text" :placeholder="key + '：可手动填写'" />
      </label>
    </div>

    <div class="pg--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['pg--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="pg--blocks">
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
          <input v-if="block.file" type="file" class="pblock--file" @change="onFileChange(block, $event)" />
          <button class="pblock--btn" @click="runBlock(block)">{{ btnLabel(block) }}</button>
          <span v-if="block.needs" class="pblock--chain">
            {{ block.needs }} ← {{ block.source }}，当前值：<b>{{ sel[block.needs] || '未选择' }}</b>
          </span>
          <span v-if="block.provides && block.provides.length" class="pblock--provides">
            返回可提供 {{ block.provides.join(' / ') }}
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

    <p class="pg--foot">
      说明：写操作（weblog）按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求；需登录只读接口（calendar）未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。inner_version 在 onMounted 自动加载用于版本自检。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { hasLogin as checkLogin } from '@/services/content-enhance.service';
import miscLongtailService from './misc-longtail.service';

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
  file?: boolean;
  fileField?: string;
  provides?: string[];
  needs?: string;
  source?: string;
  confirmMsg?: string;
  params?: (sel: Record<string, any>, v: string) => Record<string, any>;
  run: (p: any) => Promise<any>;
}

const loggedIn = checkLogin();

const tabs: { code: string; name: string }[] = [
  { code: '8.1', name: '8.1 杂项与统计（9）' },
];

const activeTab = ref<string>('8.1');

// ---------- 返回数据归一化：兼容 res.data / res.result / res.xxx ----------

const LIST_KEYS = [
  'data', 'result', 'list', 'records', 'songs', 'albums', 'artists', 'playlists', 'products',
  'mvs', 'mv', 'djRadios', 'djprogram', 'djPrograms', 'topics', 'content', 'items', 'feeds',
  'threads', 'comments', 'resources', 'dataList', 'songlist', 'playRecordList', 'weekData',
  'allData', 'userlist', 'data_list', 'calendarList', 'events',
];

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
    r.roomId ?? r.ugcId ?? r.targetId ?? r.data?.id ?? r.song?.id ?? index
  );
}

function pickTitle(raw: any, index: number): string {
  const r = raw ?? {};
  const t =
    r.name ?? r.title ?? r.nickname ?? r.songName ?? r.albumName ?? r.playlistName ??
    r.desc ?? r.content ?? r.text ?? r.message ?? r.keyword ?? r.version ?? r.song?.name ?? r.data?.name;
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

// ---------- 9 个接口 → 9 个真实调用点区块 ----------
// 写操作：weblog，未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用。
// 需登录只读：calendar，未登录降级；时间参数用 new Date() 生成。
// 待核不进主路径：pl_count（业务异常，仅手动点击触发，不自动加载）。
// 只读可自动加载：inner_version（应用启动版本自检）。

const blocks: Block[] = [
  {
    module: 'inner_version', title: '内部版本自检', desc: '只读：应用启动即 onMounted 自动加载，校验前后端版本兼容', tab: '8.1',
    kind: 'read', url: '/inner/version', auto: true,
    params: () => ({}),
    run: miscLongtailService.getInnerVersion,
  },
  {
    module: 'weblog', title: 'Web 日志上报', desc: '写操作：上报 Web 日志（需登录 + 二次确认）', tab: '8.1',
    kind: 'write', url: '/weblog',
    input: { label: '日志内容（手动输入，可选）', def: '' },
    params: (_s, v) => ({ content: v || 'page_view' }),
    confirmMsg: '确认上报 Web 日志（写操作）吗？',
    run: miscLongtailService.sendWeblog,
  },
  {
    module: 'threshold_detail_get', title: '阈值详情', desc: '只读：查询阈值详情', tab: '8.1',
    kind: 'read', url: '/threshold/detail/get',
    params: () => ({}),
    run: miscLongtailService.getThresholdDetail,
  },
  {
    module: 'summary_annual', title: '年度听歌总结', desc: '只读：展示年度听歌数据', tab: '8.1',
    kind: 'read', url: '/summary/annual',
    params: () => ({}),
    run: miscLongtailService.getSummaryAnnual,
  },
  {
    module: 'creator_authinfo_get', title: '创作者认证信息', desc: '只读：查询创作者认证资料', tab: '8.1',
    kind: 'read', url: '/creator/authinfo/get',
    params: () => ({}),
    run: miscLongtailService.getCreatorAuthinfo,
  },
  {
    module: 'pl_count', title: '计数', desc: '待核：业务异常，不进主路径，仅手动点击触发、不自动加载', tab: '8.1',
    kind: 'read', url: '/pl/count',
    params: () => ({}),
    run: miscLongtailService.getPlCount,
  },
  {
    module: 'batch', title: '批量接口', desc: '只读：批量请求入口，参数可手动输入', tab: '8.1',
    kind: 'read', url: '/batch',
    input: { label: '批量参数（可选，手动输入）', def: '' },
    params: (_s, v) => (v ? { data: v } : {}),
    run: miscLongtailService.getBatch,
  },
  {
    module: 'get_userids', title: '用户 ID 查询', desc: '只读：查询用户 ID 列表', tab: '8.1',
    kind: 'read', url: '/get/userids',
    params: () => ({}),
    run: miscLongtailService.getUserids,
  },
  {
    module: 'calendar', title: '日历', desc: '需登录只读：时间参数 startTime/endTime 用 new Date() 生成（不硬编码）', tab: '8.1',
    kind: 'loginRead', url: '/calendar',
    params: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { startTime: start, endTime: now.getTime() };
    },
    run: miscLongtailService.getCalendar,
  },
];

// 参数池：自动收集所有 needs / provides 的 key，来自上游列表点击项或手动输入
const sel = reactive<Record<string, any>>({});
blocks.forEach((block) => {
  if (block.needs) sel[block.needs] = 0;
  (block.provides || []).forEach((key) => {
    if (!(key in sel)) sel[key] = 0;
  });
});
const selKeys = Object.keys(sel);

/** 每个区块独立的输入框值 */
const inputs = reactive<Record<string, string>>({});
/** 每个区块独立的文件选择值（上传类接口用） */
const files = reactive<Record<string, File | null>>({});
/** 每个区块独立的请求结果 */
const states = reactive<Record<string, BlockState>>({});

blocks.forEach((block) => {
  states[block.module] = { loading: false, loaded: false, cards: [], raw: null, tip: '' };
  if (block.input) inputs[block.module] = block.input.def ?? '';
  if (block.file) files[block.module] = null;
});

const activeBlocks = computed(() => blocks.filter((block) => block.tab === activeTab.value));

/** 把上游返回的首项 id 或原始返回里的 roomId/songId/albumId 写入参数池 */
function captureProvided(block: Block, st: BlockState): void {
  if (!block.provides || !block.provides.length) return;
  let id: any = st.cards.length ? st.cards[0].id : undefined;
  if (id == null) {
    const r = st.raw ?? {};
    id = r.roomId ?? r.songId ?? r.albumId ?? r.id ?? r.data?.roomId ?? r.data?.songId ??
      r.data?.albumId ?? r.data?.id ?? r.result?.id;
  }
  if (id != null && id !== 0) {
    block.provides.forEach((key) => {
      sel[key] = id;
    });
  }
}

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
  let payload: any;
  if (block.file) {
    const fd = new FormData();
    const base = block.params ? block.params(sel, inputVal) || {} : {};
    Object.keys(base).forEach((k) => fd.append(k, String(base[k])));
    const f = files[block.module];
    if (f) fd.append(block.fileField || 'songFile', f);
    payload = fd;
  } else {
    payload = block.params ? block.params(sel, inputVal) || {} : {};
  }

  st.loading = true;
  st.loaded = true;
  st.tip = '';
  try {
    const res = await block.run(payload);
    st.raw = res ?? {};
    st.cards = normalize(res);
    captureProvided(block, st);
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

/** 上传类文件选择 */
function onFileChange(block: Block, e: Event): void {
  const target = e.target as HTMLInputElement;
  files[block.module] = target.files?.[0] ?? null;
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
  // 仅自动加载只读型 inner_version（应用启动版本自检）；写操作 / 需登录接口 / 待核接口绝不自动触发
  loadAutoTab(activeTab.value);
});
</script>

<style scoped lang="less">
.pg {
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

  &--file {
    font-size: 13px;
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
