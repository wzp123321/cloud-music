<template>
  <div class="pg">
    <cm-navbar :title="'UGC 与一起听'" :hasLoadMore="false"></cm-navbar>

    <p class="pg--intro">
      共 15 个接口（任务 4.1 UGC 内容 7 个、4.2 一起听房间 8 个），按 capability 分组切换，每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>。读取型接口可匿名请求；需登录只读接口未登录降级不发请求；
      写操作需登录 + <code>window.confirm</code> 二次确认，且绝不在 <code>onMounted</code> 自动触发。
      参数链路：<code>ugc_*_get</code> 的 id ← <code>ugc_artist_search</code> 搜索结果；<code>room_check/status/sync_playlist_get</code> 的 roomId ← <code>room_create</code> 返回或输入框。
    </p>

    <div class="pg--globals">
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
      说明：写操作按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求；需登录只读接口未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。列表项点击可把上游 id 写入参数池，供下游详情接口带参。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { hasLogin as checkLogin } from '@/services/content-enhance.service';
import ugcListentogetherService from './ugc-listentogether.service';

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
  { code: '4.1', name: '4.1 UGC 内容查看（7）' },
  { code: '4.2', name: '4.2 一起听房间（8）' },
];

const activeTab = ref<string>('4.1');

// ---------- 返回数据归一化：兼容 res.data / res.result / res.xxx ----------

const LIST_KEYS = [
  'data', 'result', 'list', 'records', 'songs', 'albums', 'artists', 'playlists', 'products',
  'mvs', 'mv', 'djRadios', 'djprogram', 'djPrograms', 'topics', 'content', 'items', 'feeds',
  'threads', 'comments', 'resources', 'dataList', 'songlist', 'playRecordList', 'weekData',
  'allData', 'userlist', 'data_list', 'rooms', 'roomList', 'contributeList', 'devoteList',
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
    r.desc ?? r.content ?? r.text ?? r.message ?? r.keyword ?? r.song?.name ?? r.data?.name;
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

// ---------- 15 个接口 → 15 个真实调用点区块 ----------
// 写操作：ugc_user_devote / room_create / play_command / heatbeat / sync_list_command / end
//   未登录用 hasLogin() 降级；点击需 window.confirm 二次确认；禁止 onMounted 自动调用。
// 需登录只读：ugc_detail / listentogether_status，未登录降级。
// 参数来源：ugc_*_get 的 id ← ugc_artist_search 结果或页面输入；
//   room_check/status/sync_playlist_get 的 roomId ← room_create 返回或页面输入。

const ugcIdInput = { label: 'id（默认取参数池 ugcId，可手动输入）', def: '' };
const ugcIdParams = (s: Record<string, any>, v: string): Record<string, any> => ({
  id: Number(v) || s.ugcId || 0,
});
const roomInput = { label: 'roomId（默认取参数池 roomId，可手动输入）', def: '' };
const roomParams = (s: Record<string, any>, v: string): Record<string, any> => ({
  roomId: v || s.roomId || 0,
});

const blocks: Block[] = [
  // 4.1 UGC 内容查看（7）
  {
    module: 'ugc_artist_search', title: 'UGC 歌手搜索', desc: '入口接口：keyword 来自输入框，返回项 id 提供给各 ugc_*_get 带参', tab: '4.1',
    kind: 'read', url: '/ugc/artist/search', auto: true, provides: ['ugcId'],
    input: { label: '搜索关键词 keyword（手动输入，留空用示例词）', def: '' },
    params: (_s, v) => ({ keyword: v || '周杰伦', limit: 30 }),
    run: ugcListentogetherService.searchUgcArtist,
  },
  {
    module: 'ugc_album_get', title: 'UGC 专辑详情', desc: 'id ← ugc_artist_search 结果 / 页面输入', tab: '4.1',
    kind: 'read', url: '/ugc/album/get', needs: 'ugcId', source: 'ugc_artist_search',
    input: ugcIdInput, params: ugcIdParams,
    run: ugcListentogetherService.getUgcAlbum,
  },
  {
    module: 'ugc_artist_get', title: 'UGC 歌手详情', desc: 'id ← ugc_artist_search 结果 / 页面输入', tab: '4.1',
    kind: 'read', url: '/ugc/artist/get', needs: 'ugcId', source: 'ugc_artist_search',
    input: ugcIdInput, params: ugcIdParams,
    run: ugcListentogetherService.getUgcArtist,
  },
  {
    module: 'ugc_detail', title: 'UGC 详情', desc: '需登录只读；id ← ugc_artist_search 结果 / 页面输入', tab: '4.1',
    kind: 'loginRead', url: '/ugc/detail', needs: 'ugcId', source: 'ugc_artist_search',
    input: ugcIdInput, params: ugcIdParams,
    run: ugcListentogetherService.getUgcDetail,
  },
  {
    module: 'ugc_mv_get', title: 'UGC MV 详情', desc: 'id ← ugc_artist_search 结果 / 页面输入', tab: '4.1',
    kind: 'read', url: '/ugc/mv/get', needs: 'ugcId', source: 'ugc_artist_search',
    input: ugcIdInput, params: ugcIdParams,
    run: ugcListentogetherService.getUgcMv,
  },
  {
    module: 'ugc_song_get', title: 'UGC 歌曲详情', desc: 'id ← ugc_artist_search 结果 / 页面输入', tab: '4.1',
    kind: 'read', url: '/ugc/song/get', needs: 'ugcId', source: 'ugc_artist_search',
    input: ugcIdInput, params: ugcIdParams,
    run: ugcListentogetherService.getUgcSong,
  },
  {
    module: 'ugc_user_devote', title: '用户 UGC 贡献', desc: '写操作：提交用户共创内容（需登录 + 二次确认）', tab: '4.1',
    kind: 'write', url: '/ugc/user/devote', needs: 'ugcId', source: 'ugc_artist_search / 手动输入',
    input: ugcIdInput, params: ugcIdParams,
    confirmMsg: '确认提交该 UGC 贡献（写操作）吗？',
    run: ugcListentogetherService.devoteUgcUser,
  },

  // 4.2 一起听房间（8）
  {
    module: 'listentogether_room_create', title: '创建一起听房间', desc: '写操作：创建房间，返回的 roomId 提供给下游接口带参', tab: '4.2',
    kind: 'write', url: '/listentogether/room/create', provides: ['roomId'],
    input: { label: '房间名称（可选，手动输入）', def: '' },
    params: (_s, v) => ({ name: v || '一起听房间' }),
    confirmMsg: '确认创建一起听房间吗？',
    run: ugcListentogetherService.createListenRoom,
  },
  {
    module: 'listentogether_room_check', title: '检查房间', desc: 'roomId ← room_create 返回 / 页面输入', tab: '4.2',
    kind: 'read', url: '/listentogether/room/check', needs: 'roomId', source: 'listentogether_room_create / 手动输入',
    input: roomInput, params: roomParams,
    run: ugcListentogetherService.checkListenRoom,
  },
  {
    module: 'listentogether_status', title: '一起听状态', desc: '需登录只读；roomId ← room_create 返回 / 页面输入', tab: '4.2',
    kind: 'loginRead', url: '/listentogether/status', needs: 'roomId', source: 'listentogether_room_create / 手动输入',
    input: roomInput, params: roomParams,
    run: ugcListentogetherService.getListenStatus,
  },
  {
    module: 'listentogether_play_command', title: '播放指令', desc: '写操作：下发播放/暂停指令（需登录 + 二次确认）', tab: '4.2',
    kind: 'write', url: '/listentogether/play/command', needs: 'roomId', source: 'listentogether_room_create / 手动输入',
    input: roomInput,
    params: (s, v) => ({ roomId: v || s.roomId || 0, command: 'play' }),
    confirmMsg: '确认下发一起听播放指令（写操作）吗？',
    run: ugcListentogetherService.sendListenPlayCommand,
  },
  {
    module: 'listentogether_heatbeat', title: '房间心跳', desc: '写操作：上报心跳保活（需登录 + 二次确认）', tab: '4.2',
    kind: 'write', url: '/listentogether/heatbeat', needs: 'roomId', source: 'listentogether_room_create / 手动输入',
    input: roomInput, params: roomParams,
    confirmMsg: '确认上报一起听心跳（写操作）吗？',
    run: ugcListentogetherService.sendListenHeatbeat,
  },
  {
    module: 'listentogether_sync_playlist_get', title: '同步歌单获取', desc: 'roomId ← room_create 返回 / 页面输入', tab: '4.2',
    kind: 'read', url: '/listentogether/sync/playlist/get', needs: 'roomId', source: 'listentogether_room_create / 手动输入',
    input: roomInput, params: roomParams,
    run: ugcListentogetherService.getListenSyncPlaylist,
  },
  {
    module: 'listentogether_sync_list_command', title: '同步列表指令', desc: '写操作：下发同步歌单变更（需登录 + 二次确认）', tab: '4.2',
    kind: 'write', url: '/listentogether/sync/list/command', needs: 'roomId', source: 'listentogether_room_create / 手动输入',
    input: roomInput, params: roomParams,
    confirmMsg: '确认下发一起听同步列表指令（写操作）吗？',
    run: ugcListentogetherService.sendListenSyncListCommand,
  },
  {
    module: 'listentogether_end', title: '结束房间', desc: '写操作：结束一起听房间（需登录 + 二次确认）', tab: '4.2',
    kind: 'write', url: '/listentogether/end', needs: 'roomId', source: 'listentogether_room_create / 手动输入',
    input: roomInput, params: roomParams,
    confirmMsg: '确认结束该一起听房间（写操作）吗？',
    run: ugcListentogetherService.endListenRoom,
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
    // 上传类：把参数放进 FormData，用 postFormRequest 提交
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
  // 只加载读取型来源列表（ugc_artist_search），给 ugc_*_get 预填 ugcId；写操作 / 需登录接口绝不自动触发
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
