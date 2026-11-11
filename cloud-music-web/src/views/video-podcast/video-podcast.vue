<template>
  <div class="video-podcast">
    <cm-navbar :title="'视频 · 播客 · 信息流 · 上传'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="video-podcast--loginbar">
      当前未登录：<code>video_timeline_*</code>、<code>voicelist_*</code>、<code>voice_detail</code> 等需登录只读接口已降级（不发请求）；
      <code>video_sub</code> / <code>voice_upload</code> 写操作不可用
    </div>
    <div v-if="toast" class="video-podcast--toast" @click="toast = ''">{{ toast }}（点击关闭）</div>

    <div class="video-podcast--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['video-podcast--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 共享参数链路面板：上游列表点选自动填入，跨 tab 保留，也可手填 -->
    <div class="video-podcast--params">
      <span class="video-podcast--params-label">参数链路（点选上游列表自动填入，跨 tab 保留，也可手填）</span>
      <label class="video-podcast--params-item">
        videoId（视频 id/vid → video_detail / video_detail_info / video_url / video_sub）
        <input v-model="params.videoId" placeholder="← video_group_list / video_timeline_all 点选" />
      </label>
      <label class="video-podcast--params-item">
        voiceId（播客 id → voicelist_search / voice_detail）
        <input v-model="params.voiceId" placeholder="← voicelist_list 点选" />
      </label>
      <label class="video-podcast--params-item">
        voiceKeyword（关键词 → voicelist_list_search / voicelist_search）
        <input v-model="params.voiceKeyword" placeholder="输入播客关键词" />
      </label>
    </div>

    <div class="video-podcast--panel">
      <p class="video-podcast--panel-tip">{{ panelTip }}</p>
      <div class="video-podcast--grid">
        <!-- 每个接口一个可交互区块，标题标注 module 名 -->
        <section
          v-for="b in visibleBlocks"
          :key="b.module"
          class="video-podcast--block"
          :class="{ 'video-podcast--block--wide': b.wide }"
        >
          <h3 class="video-podcast--block-title">
            <code class="video-podcast--module">{{ b.module }}</code> {{ b.name }}
            <span v-if="b.kind === 'invalid'" class="video-podcast--badge video-podcast--badge--invalid">已登记失效</span>
            <span v-else-if="b.kind === 'pending'" class="video-podcast--badge video-podcast--badge--pending">待核·不进主路径</span>
            <span v-else-if="b.kind === 'write' || b.kind === 'upload'" class="video-podcast--badge video-podcast--badge--write">写操作</span>
            <span v-else-if="b.kind === 'loginRead'" class="video-podcast--badge video-podcast--badge--login">需登录只读</span>
          </h3>
          <p v-if="b.note" class="video-podcast--note">{{ b.note }}</p>
          <p v-if="(b.kind === 'loginRead' || b.kind === 'write' || b.kind === 'upload') && !hasLogin" class="video-podcast--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div class="video-podcast--block-actions">
            <label v-if="b.inputKey" class="video-podcast--inline-label">
              {{ b.inputLabel || b.inputKey }}
              <input
                :value="params[b.inputKey || '']"
                :placeholder="b.inputHint || '点选上游列表自动填入，或手填'"
                @input="onParamInput(b.inputKey, $event)"
              />
            </label>
            <label v-if="b.kind === 'upload'" class="video-podcast--inline-label">
              选择文件<input type="file" accept="audio/*" @change="onFileChange" />
            </label>
            <button
              class="video-podcast--btn"
              :class="{ 'video-podcast--btn--write': b.kind === 'write' || b.kind === 'upload' }"
              @click="runBlock(b)"
            >
              {{ b.buttonText || '加载' }}
            </button>
            <span class="video-podcast--count">{{ results[b.module]?.length || 0 }} 条</span>
            <span v-if="b.emit" class="video-podcast--emit">点选列表项 → 填入 {{ b.emit }}</span>
          </div>
          <div v-if="results[b.module] && results[b.module].length" class="video-podcast--list">
            <div
              v-for="(item, idx) in results[b.module]"
              :key="b.module + '_' + idx"
              class="video-podcast--item"
              :class="{ 'video-podcast--item--clickable': !!b.emit }"
              @click="onItemClick(b, item)"
            >
              <span class="video-podcast--item-title">{{ item.title }}</span>
              <span class="video-podcast--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="video-podcast--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="video-podcast--empty">暂无数据或接口返回为空</p>
        </section>
      </div>
      <div v-if="writeResult" class="video-podcast--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import videoPodcastService from '../../apis/video-podcast/video-podcast.service';

interface CardItem {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

type BlockKind = 'read' | 'loginRead' | 'write' | 'upload' | 'pending' | 'invalid';

interface Block {
  module: string;
  name: string;
  tab: string;
  kind: BlockKind;
  run: () => Promise<any>;
  inputKey?: string;
  inputLabel?: string;
  inputHint?: string;
  emit?: string;
  note?: string;
  buttonText?: string;
  wide?: boolean;
  auto?: boolean;
}

/** 2.1~2.3 按 capability 子任务分 tab */
const tabs = [
  { code: 'c2_1', name: '2.1 视频发现（5）' },
  { code: 'c2_2', name: '2.2 视频播放与订阅（4）' },
  { code: 'c2_3', name: '2.3 播客（5）' },
];

const panelTips: Record<string, string> = {
  c2_1: '5 个视频发现接口，每接口一个可交互区块，标题标注 module 名；video_group_list / video_timeline_all 列表点选提供 videoId；video_timeline_* 需登录，未登录降级。',
  c2_2: 'video_detail 待核（需有效视频 id），手动按钮 + 输入框，不进主路径；video_detail_info(vid) / video_url(id) / video_sub(写) 的 videoId ← 上游视频列表点选，列表点击带参再请求详情。',
  c2_3: 'voicelist_* / voice_detail 需登录只读降级；voicelist_list 列表点选提供 voiceId ← voicelist_search / voice_detail；voice_upload 为上传写操作（postFormRequest + 二次确认）。',
};

const hasLogin = ref<boolean>(checkLogin());
const activeTab = ref<string>('c2_1');
const toast = ref<string>('');
const writeResult = ref<string>('');
const params = reactive<Record<string, string>>({
  videoId: '',
  voiceId: '',
  groupId: '',
  voiceKeyword: '',
  voiceName: '',
});
const results = reactive<Record<string, CardItem[]>>({});
const uploadFile = ref<File | null>(null);

/** 14 个接口一一对应 14 个区块，每个 run 即该接口在页面的真实调用点 */
const blocks: Block[] = [
  // 2.1 视频发现（5）
  { module: 'video_category_list', name: '视频分类', tab: 'c2_1', kind: 'read', auto: true, run: () => videoPodcastService.getVideoCategoryList() },
  { module: 'video_group', name: '视频分组', tab: 'c2_1', kind: 'read', inputKey: 'groupId', inputLabel: '分组 id', run: () => videoPodcastService.getVideoGroup({ id: Number(params.groupId) || undefined, groupId: params.groupId || undefined }) },
  { module: 'video_group_list', name: '视频分组列表（videoId 来源）', tab: 'c2_1', kind: 'read', emit: 'videoId', auto: true, wide: true, run: () => videoPodcastService.getVideoGroupList() },
  { module: 'video_timeline_all', name: '全部视频信息流（需登录）', tab: 'c2_1', kind: 'loginRead', emit: 'videoId', run: () => videoPodcastService.getVideoTimelineAll() },
  { module: 'video_timeline_recommend', name: '推荐视频信息流（需登录）', tab: 'c2_1', kind: 'loginRead', run: () => videoPodcastService.getVideoTimelineRecommend() },
  // 2.2 视频播放与订阅（4）
  { module: 'video_detail', name: '视频详情', tab: 'c2_2', kind: 'pending', inputKey: 'videoId', inputLabel: '视频 id', buttonText: '手动查看', note: '待核：需有效视频 id（非分组 id），不进主路径，仅手动按钮 + 输入框触发', run: () => videoPodcastService.getVideoDetail({ id: params.videoId }) },
  { module: 'video_detail_info', name: '视频详情信息', tab: 'c2_2', kind: 'read', inputKey: 'videoId', inputLabel: 'vid', run: () => videoPodcastService.getVideoDetailInfo({ vid: params.videoId, id: params.videoId }) },
  { module: 'video_url', name: '视频播放地址', tab: 'c2_2', kind: 'read', inputKey: 'videoId', inputLabel: 'id', run: () => videoPodcastService.getVideoUrl({ id: params.videoId, vid: params.videoId }) },
  { module: 'video_sub', name: '订阅视频（写）', tab: 'c2_2', kind: 'write', inputKey: 'videoId', inputLabel: 'id', buttonText: '订阅(t=1)', run: () => videoPodcastService.setVideoSub({ id: params.videoId, vid: params.videoId, t: 1 }) },
  // 2.3 播客（5）
  { module: 'voicelist_list', name: '播客列表（voiceId 来源，需登录）', tab: 'c2_3', kind: 'loginRead', emit: 'voiceId', wide: true, run: () => videoPodcastService.getVoicelistList({ limit: 30 }) },
  { module: 'voicelist_list_search', name: '播客列表搜索（需登录）', tab: 'c2_3', kind: 'loginRead', inputKey: 'voiceKeyword', inputLabel: '关键词 keywords', run: () => videoPodcastService.getVoicelistListSearch({ keywords: params.voiceKeyword, keyword: params.voiceKeyword }) },
  { module: 'voicelist_search', name: '播客搜索（需登录）', tab: 'c2_3', kind: 'loginRead', inputKey: 'voiceId', inputLabel: 'id（← voicelist_list）', run: () => videoPodcastService.getVoicelistSearch({ id: params.voiceId, voiceListId: params.voiceId, keywords: params.voiceKeyword }) },
  { module: 'voice_detail', name: '播客详情（需登录）', tab: 'c2_3', kind: 'loginRead', inputKey: 'voiceId', inputLabel: 'id', run: () => videoPodcastService.getVoiceDetail({ id: params.voiceId, voiceId: params.voiceId }) },
  {
    module: 'voice_upload',
    name: '上传声音（写 / 上传）',
    tab: 'c2_3',
    kind: 'upload',
    inputKey: 'voiceName',
    inputLabel: '声音名称 name',
    buttonText: '上传',
    note: '写操作：未登录降级 + window.confirm 二次确认；postFormRequest multipart 上传，禁止 onMounted 自动调用',
    run: () => {
      const formData = new FormData();
      if (uploadFile.value) formData.append('songFile', uploadFile.value);
      formData.append('name', params.voiceName || '未命名声音');
      return videoPodcastService.uploadVoice(formData);
    },
  },
];

const visibleBlocks = computed(() => blocks.filter((b) => b.tab === activeTab.value));
const panelTip = computed(() => panelTips[activeTab.value] || '');

/** 兼容 res.data / res.result / res.xxx / 深层数组等多种结构 */
const extractList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const candidates = [
    res.data, res.result, res.list, res.data?.list, res.result?.list, res.data?.data, res.data?.records,
    res.programs, res.data?.programs, res.result?.programs, res.djRadios, res.data?.djRadios,
    res.categories, res.data?.categories, res.radios, res.data?.radios, res.toplist, res.data?.toplist,
    res.videos, res.data?.videos, res.voices, res.voiceList, res.data?.voiceList,
    res.tasks, res.data?.tasks, res.songs, res.data?.songs, res.records,
  ];
  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }
  for (const key of Object.keys(res)) {
    if (Array.isArray(res[key])) return res[key];
  }
  for (const obj of [res.data, res.result]) {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) return obj[key];
      }
    }
  }
  return [];
};

const extractObj = (res: any): Record<string, any> => {
  if (!res) return {};
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res.result && typeof res.result === 'object' && !Array.isArray(res.result)) return res.result;
  return res;
};

const toCard = (raw: any): CardItem => {
  const r = raw || {};
  const id = Number(r.id ?? r.rid ?? r.vid ?? r.cateId ?? r.categoryId ?? r.voiceId ?? r.voiceListId ?? r.programId ?? r.taskId ?? r.songId ?? r.userId ?? 0) || 0;
  const title = String(r.title ?? r.name ?? r.radioName ?? r.djName ?? r.nickname ?? r.content ?? r.msg ?? r.desc ?? '未命名');
  const cover = String(r.cover ?? r.coverUrl ?? r.picUrl ?? r.imgUrl ?? r.avatarUrl ?? r.coverImgUrl ?? '');
  const subtitle = String(r.subtitle ?? r.desc ?? r.description ?? r.artist ?? r.creator?.nickname ?? r.dj?.nickname ?? r.user?.nickname ?? r.rcmdtext ?? '');
  return { id, title, cover, subtitle, raw: r };
};

const toList = (res: any): CardItem[] => {
  const list = extractList(res);
  if (list.length) return list.map(toCard);
  const obj = extractObj(res);
  if (obj && Object.keys(obj).length) {
    return [toCard({ ...obj, title: obj.title ?? obj.name ?? obj.content ?? `响应 code=${obj.code ?? res?.code ?? '—'}` })];
  }
  return [];
};

const pickId = (raw: any): number => {
  const r = raw || {};
  return Number(r.id ?? r.rid ?? r.vid ?? r.cateId ?? r.categoryId ?? r.voiceId ?? r.voiceListId ?? r.programId ?? r.mainSongId ?? 0) || 0;
};

const requireLogin = (): boolean => {
  if (!hasLogin.value) {
    toast.value = '该接口需要登录后才能查看（已降级，不发请求）';
    return false;
  }
  return true;
};

const writeGuard = (confirmText: string): boolean => {
  if (!hasLogin.value) {
    toast.value = '请先登录后再执行该写操作（已降级，不发请求）';
    return false;
  }
  if (!window.confirm(confirmText)) {
    toast.value = '已取消操作';
    return false;
  }
  return true;
};

const onFileChange = (e: Event) => {
  uploadFile.value = (e.target as HTMLInputElement).files?.[0] ?? null;
};

const onParamInput = (key: string | undefined, e: Event) => {
  if (!key) return;
  params[key] = (e.target as HTMLInputElement).value;
};

/** 列表 → 详情参数来源：点选上游列表项把 id 填入共享参数 */
const onItemClick = (b: Block, item: CardItem) => {
  if (!b.emit) return;
  const id = pickId(item.raw) || item.id;
  if (!id) {
    toast.value = '该条目未返回可用 id';
    return;
  }
  params[b.emit] = String(id);
  toast.value = `已选择 #${id}，已填入共享参数 ${b.emit}，可用于对应详情/写操作`;
};

const runBlock = async (b: Block) => {
  // 失效接口：仅手动核验时发一次请求，绝不进主流程/自动触发
  if (b.kind === 'invalid') {
    if (!window.confirm(`${b.module} 已登记失效（上游 404），仅用于登记核验；仍要手动发起一次请求吗？`)) {
      toast.value = '已取消，未发起请求（该接口不进主流程）';
      return;
    }
  }
  if (b.kind === 'loginRead' && !requireLogin()) {
    results[b.module] = [];
    return;
  }
  if (b.kind === 'write' || b.kind === 'upload') {
    if (!writeGuard(`确定执行「${b.name}（${b.module}）」吗？该操作会向服务端提交数据。`)) return;
    if (b.kind === 'upload' && !uploadFile.value) {
      toast.value = '请先选择要上传的文件';
      return;
    }
  }
  try {
    const res = await b.run();
    results[b.module] = toList(res);
    if (b.kind === 'write' || b.kind === 'upload') {
      const obj = extractObj(res);
      writeResult.value = `${b.name} 已提交｜code=${obj?.code ?? res?.code ?? '—'}｜${obj?.message ?? res?.message ?? '无附加信息'}`;
    } else if (b.kind === 'invalid') {
      toast.value = `${b.module} 手动核验完成（已登记失效，结果按空值处理）`;
    } else {
      toast.value = `${b.name} 已加载 ${results[b.module].length} 条`;
    }
  } catch {
    results[b.module] = [];
    if (b.kind === 'write' || b.kind === 'upload') writeResult.value = `${b.name} 请求失败，已按空值处理`;
    else toast.value = `${b.name} 请求失败，已返回空值`;
  }
};

const switchTab = (code: string) => {
  activeTab.value = code;
  // 仅匿名只读读取型接口自动加载；写/需登录/待核/失效一律不自动
  blocks.filter((b) => b.tab === code && b.auto && b.kind === 'read').forEach((b) => runBlock(b));
};

onMounted(() => switchTab(activeTab.value));
</script>

<style scoped lang="less">
.video-podcast {
  width: 1400px;
  margin: 0 auto;
  padding: 24px 0 48px;

  code {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(194, 12, 12, 0.08);
    color: var(--color-primary, #c20c0c);
    font-size: 12px;
  }

  &--loginbar {
    margin-top: 18px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #fff7e6;
    color: #ad6800;
    font-size: 13px;
    line-height: 1.7;
  }

  &--toast {
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: 6px;
    background: #f0f7ff;
    color: #31708f;
    font-size: 13px;
    cursor: pointer;
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

  &--params {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-top: 18px;
    padding: 14px 18px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--params-label {
    color: #999;
    font-size: 13px;
  }

  &--params-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 13px;

    input {
      width: 210px;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary, #c20c0c);
      }
    }
  }

  &--panel {
    margin-top: 22px;
  }

  &--panel-tip {
    margin-bottom: 16px;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
  }

  &--grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  &--block {
    padding: 16px 20px;
    border-radius: 8px;
    background: var(--color-default, #fff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  &--block--wide {
    grid-column: 1 / -1;
  }

  &--block-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  &--module {
    margin-right: 6px;
  }

  &--badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 400;
    vertical-align: middle;
  }

  &--badge--invalid,
  &--badge--write {
    background: #fff1f0;
    color: #cf1322;
  }

  &--badge--pending {
    background: #fff7e6;
    color: #d48806;
  }

  &--badge--login {
    background: #f0f5ff;
    color: #2f54eb;
  }

  &--note {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
    line-height: 1.6;
  }

  &--degrade {
    margin-top: 8px;
    color: #d48806;
    font-size: 12px;
  }

  &--block-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 12px 0;
  }

  &--inline-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 13px;

    input {
      width: 190px;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary, #c20c0c);
      }
    }

    input[type='file'] {
      width: 200px;
      padding: 4px 0;
      border: none;
    }
  }

  &--btn {
    padding: 7px 16px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    background: var(--color-default, #fff);
    color: #444;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
    }
  }

  &--btn--write {
    border-color: var(--color-primary, #c20c0c);
    color: var(--color-primary, #c20c0c);
  }

  &--count,
  &--emit {
    color: #999;
    font-size: 12px;
  }

  &--emit {
    color: #2f54eb;
  }

  &--list {
    margin-top: 10px;
    max-height: 240px;
    overflow-y: auto;
  }

  &--item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 6px;
    border-bottom: 1px solid #f5f5f5;
  }

  &--item--clickable {
    cursor: pointer;

    &:hover {
      background: #fafafa;
    }
  }

  &--item-title {
    flex: 1;
    color: #333;
    font-size: 13px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--item-sub,
  &--item-id {
    color: #aaa;
    font-size: 12px;
    white-space: nowrap;
  }

  &--empty {
    margin-top: 10px;
    color: #bbb;
    font-size: 12px;
  }

  &--result {
    margin-top: 20px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #f6ffed;
    color: #389e0d;
    font-size: 13px;
  }
}
</style>
