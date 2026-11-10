<template>
  <div class="dj-radio">
    <cm-navbar :title="'电台 · 分类 · 节目 · 榜单'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="dj-radio--loginbar">
      当前未登录：<code>dj_sub</code> 订阅写操作与 <code>dj_sublist</code> 订阅列表已降级（不发请求）；其余匿名只读接口可正常加载
    </div>
    <div v-if="toast" class="dj-radio--toast" @click="toast = ''">{{ toast }}（点击关闭）</div>

    <div class="dj-radio--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['dj-radio--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 共享参数链路面板：上游列表点选自动填入，跨 tab 保留，也可手填 -->
    <div class="dj-radio--params">
      <span class="dj-radio--params-label">参数链路（点选上游列表自动填入，跨 tab 保留，也可手填）</span>
      <label class="dj-radio--params-item">
        rid（电台 id → dj_detail / dj_program / dj_sub / dj_subscriber）
        <input v-model="params.rid" placeholder="← dj_hot / dj_recommend / dj_toplist* 点选" />
      </label>
      <label class="dj-radio--params-item">
        cateId（分类 id → dj_radio_hot / dj_category_recommend）
        <input v-model="params.cateId" placeholder="← dj_catelist 点选" />
      </label>
      <label class="dj-radio--params-item">
        programId（节目 id → dj_program_detail）
        <input v-model="params.programId" placeholder="← dj_program 的 programs 点选" />
      </label>
    </div>

    <div class="dj-radio--panel">
      <p class="dj-radio--panel-tip">{{ panelTip }}</p>
      <div class="dj-radio--grid">
        <!-- 每个接口一个可交互区块，标题标注 module 名 -->
        <section
          v-for="b in visibleBlocks"
          :key="b.module"
          class="dj-radio--block"
          :class="{ 'dj-radio--block--wide': b.wide }"
        >
          <h3 class="dj-radio--block-title">
            <code class="dj-radio--module">{{ b.module }}</code> {{ b.name }}
            <span v-if="b.kind === 'invalid'" class="dj-radio--badge dj-radio--badge--invalid">已登记失效</span>
            <span v-else-if="b.kind === 'pending'" class="dj-radio--badge dj-radio--badge--pending">待核·不进主路径</span>
            <span v-else-if="b.kind === 'write' || b.kind === 'upload'" class="dj-radio--badge dj-radio--badge--write">写操作</span>
            <span v-else-if="b.kind === 'loginRead'" class="dj-radio--badge dj-radio--badge--login">需登录只读</span>
          </h3>
          <p v-if="b.note" class="dj-radio--note">{{ b.note }}</p>
          <p v-if="(b.kind === 'loginRead' || b.kind === 'write' || b.kind === 'upload') && !hasLogin" class="dj-radio--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div class="dj-radio--block-actions">
            <label v-if="b.inputKey" class="dj-radio--inline-label">
              {{ b.inputLabel || b.inputKey }}
              <input
                :value="params[b.inputKey || '']"
                :placeholder="b.inputHint || '点选上游列表自动填入，或手填'"
                @input="onParamInput(b.inputKey, $event)"
              />
            </label>
            <label v-if="b.kind === 'upload'" class="dj-radio--inline-label">
              选择文件<input type="file" @change="onFileChange" />
            </label>
            <button
              class="dj-radio--btn"
              :class="{ 'dj-radio--btn--write': b.kind === 'write' || b.kind === 'upload' }"
              @click="runBlock(b)"
            >
              {{ b.buttonText || '加载' }}
            </button>
            <span class="dj-radio--count">{{ results[b.module]?.length || 0 }} 条</span>
            <span v-if="b.emit" class="dj-radio--emit">点选列表项 → 填入 {{ b.emit }}</span>
          </div>
          <div v-if="results[b.module] && results[b.module].length" class="dj-radio--list">
            <div
              v-for="(item, idx) in results[b.module]"
              :key="b.module + '_' + idx"
              class="dj-radio--item"
              :class="{ 'dj-radio--item--clickable': !!b.emit }"
              @click="onItemClick(b, item)"
            >
              <span class="dj-radio--item-title">{{ item.title }}</span>
              <span class="dj-radio--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="dj-radio--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="dj-radio--empty">暂无数据或接口返回为空</p>
        </section>
      </div>
      <div v-if="writeResult" class="dj-radio--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance.service';
import djRadioService from './dj-radio.service';

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

/** 1.1~1.4 按 capability 子任务分 tab */
const tabs = [
  { code: 'c1_1', name: '1.1 电台发现（9）' },
  { code: 'c1_2', name: '1.2 电台与节目（6）' },
  { code: 'c1_3', name: '1.3 订阅与榜单（9）' },
  { code: 'c1_4', name: '1.4 推荐与匹配（3）' },
];

const panelTips: Record<string, string> = {
  c1_1: '9 个匿名只读发现型接口，每接口一个可交互区块，标题标注 module 名；dj_catelist 列表点选提供 cateId，dj_hot / dj_recommend 列表点选提供 rid。',
  c1_2: '详情链路：rid ← 1.1 电台列表点选；cateId ← dj_catelist；dj_program 加载后点选 programs 项得到 programId ← dj_program_detail；列表点击带参再请求详情。',
  c1_3: 'dj_sub 为写操作（未登录降级 + window.confirm 二次确认 + 禁止 onMounted 自动调用）；dj_sublist 需登录只读降级；5 个 toplist 返回项均作为 rid 来源。',
  c1_4: 'program_recommend 常规接入；aidj_content_rcmd 为待核接口，不进主路径（手动按钮 + 输入框）；audio_match 手动带 id 触发。',
};

const hasLogin = ref<boolean>(checkLogin());
const activeTab = ref<string>('c1_1');
const toast = ref<string>('');
const writeResult = ref<string>('');
const params = reactive<Record<string, string>>({
  rid: '',
  cateId: '',
  programId: '',
  recommendType: '',
  aidjId: '',
  matchId: '',
});
const results = reactive<Record<string, CardItem[]>>({});
const uploadFile = ref<File | null>(null);

/** 27 个接口一一对应 27 个区块，每个 run 即该接口在页面的真实调用点 */
const blocks: Block[] = [
  // 1.1 电台发现（9）
  { module: 'dj_catelist', name: '电台分类（cateId 来源）', tab: 'c1_1', kind: 'read', emit: 'cateId', auto: true, wide: true, run: () => djRadioService.getDjCatelist() },
  { module: 'dj_category_recommend', name: '分类推荐', tab: 'c1_1', kind: 'read', inputKey: 'cateId', inputLabel: 'cateId', run: () => djRadioService.getDjCategoryRecommend({ cateId: Number(params.cateId) || undefined }) },
  { module: 'dj_category_excludehot', name: '分类冷门', tab: 'c1_1', kind: 'read', run: () => djRadioService.getDjCategoryExcludehot() },
  { module: 'dj_banner', name: '电台轮播', tab: 'c1_1', kind: 'read', auto: true, run: () => djRadioService.getDjBanner() },
  { module: 'dj_hot', name: '热门电台（rid 来源）', tab: 'c1_1', kind: 'read', emit: 'rid', auto: true, run: () => djRadioService.getDjHot({ limit: 30 }) },
  { module: 'dj_recommend', name: '推荐电台（rid 来源）', tab: 'c1_1', kind: 'read', emit: 'rid', auto: true, run: () => djRadioService.getDjRecommend() },
  { module: 'dj_recommend_type', name: '分类类型推荐', tab: 'c1_1', kind: 'read', inputKey: 'recommendType', inputLabel: 'type', run: () => djRadioService.getDjRecommendType({ type: Number(params.recommendType) || undefined }) },
  { module: 'dj_personalize_recommend', name: '个性化推荐', tab: 'c1_1', kind: 'read', run: () => djRadioService.getDjPersonalizeRecommend({ limit: 30 }) },
  { module: 'dj_today_perfered', name: '今日优选', tab: 'c1_1', kind: 'read', auto: true, run: () => djRadioService.getDjTodayPerfered() },
  // 1.2 电台与节目（6）
  { module: 'dj_detail', name: '电台详情', tab: 'c1_2', kind: 'read', inputKey: 'rid', inputLabel: 'rid', run: () => djRadioService.getDjDetail({ rid: Number(params.rid) || 0 }) },
  { module: 'dj_program', name: '电台节目（programId 来源）', tab: 'c1_2', kind: 'read', inputKey: 'rid', inputLabel: 'rid', emit: 'programId', wide: true, run: () => djRadioService.getDjProgram({ rid: Number(params.rid) || 0, limit: 30 }) },
  { module: 'dj_program_detail', name: '节目详情', tab: 'c1_2', kind: 'read', inputKey: 'programId', inputLabel: '节目 id', run: () => djRadioService.getDjProgramDetail({ id: Number(params.programId) || 0 }) },
  { module: 'dj_program_toplist', name: '节目榜单', tab: 'c1_2', kind: 'read', run: () => djRadioService.getDjProgramToplist({ limit: 30 }) },
  { module: 'dj_program_toplist_hours', name: '节目小时榜', tab: 'c1_2', kind: 'read', run: () => djRadioService.getDjProgramToplistHours({ limit: 30 }) },
  { module: 'dj_radio_hot', name: '分类热门电台', tab: 'c1_2', kind: 'read', inputKey: 'cateId', inputLabel: 'cateId', run: () => djRadioService.getDjRadioHot({ cateId: Number(params.cateId) || 0, limit: 30 }) },
  // 1.3 订阅与榜单（9）
  { module: 'dj_sub', name: '订阅电台（写）', tab: 'c1_3', kind: 'write', inputKey: 'rid', inputLabel: 'rid', buttonText: '订阅(t=1)', run: () => djRadioService.setDjSub({ rid: Number(params.rid) || 0, t: 1 }) },
  { module: 'dj_sublist', name: '我的订阅电台', tab: 'c1_3', kind: 'loginRead', run: () => djRadioService.getDjSublist({ limit: 30 }) },
  { module: 'dj_subscriber', name: '电台订阅者', tab: 'c1_3', kind: 'read', inputKey: 'rid', inputLabel: 'rid', run: () => djRadioService.getDjSubscriber({ rid: Number(params.rid) || 0, limit: 30 }) },
  { module: 'dj_paygift', name: '电台付费礼物', tab: 'c1_3', kind: 'read', run: () => djRadioService.getDjPaygift({ limit: 30 }) },
  { module: 'dj_toplist', name: '电台榜（rid 来源）', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplist({ limit: 30 }) },
  { module: 'dj_toplist_hours', name: '电台小时榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistHours({ limit: 30 }) },
  { module: 'dj_toplist_newcomer', name: '电台新人榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistNewcomer({ limit: 30 }) },
  { module: 'dj_toplist_pay', name: '电台付费榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistPay({ limit: 30 }) },
  { module: 'dj_toplist_popular', name: '电台热门榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistPopular({ limit: 30 }) },
  // 1.4 推荐与匹配（3）
  { module: 'program_recommend', name: '推荐节目', tab: 'c1_4', kind: 'read', run: () => djRadioService.getProgramRecommend({ limit: 30 }) },
  { module: 'aidj_content_rcmd', name: 'AI DJ 内容推荐', tab: 'c1_4', kind: 'pending', inputKey: 'aidjId', inputLabel: '内容 id / 关键词', buttonText: '手动查看', note: '待核：业务异常，不进主路径，仅手动按钮 + 输入框触发，不做自动请求', run: () => djRadioService.getAidjContentRcmd({ id: params.aidjId, keyword: params.aidjId }) },
  { module: 'audio_match', name: '音频匹配', tab: 'c1_4', kind: 'read', inputKey: 'matchId', inputLabel: '音频 id', note: '手动触发，id 可来自上方列表或手填', run: () => djRadioService.getAudioMatch({ id: Number(params.matchId) || 0 }) },
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
.dj-radio {
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
    grid-template-columns: repeat(2, 1fr);
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
