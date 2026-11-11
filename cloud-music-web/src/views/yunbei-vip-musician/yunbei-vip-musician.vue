<template>
  <div class="yunbei-vip-musician">
    <cm-navbar :title="'云贝 · 会员成长 · 音乐人中心'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="yunbei-vip-musician--loginbar">
      当前未登录：本页 <code>yunbei*</code> / <code>vip_*</code> / <code>musician_*</code> 需登录只读接口与 4 个写操作均已降级（不发请求）；
      <code>yunbei_info</code> 已登记失效（上游 404）
    </div>
    <div v-if="toast" class="yunbei-vip-musician--toast" @click="toast = ''">{{ toast }}（点击关闭）</div>

    <div class="yunbei-vip-musician--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['yunbei-vip-musician--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 共享参数链路面板：上游任务列表点选自动填入，也可手填 -->
    <div class="yunbei-vip-musician--params">
      <span class="yunbei-vip-musician--params-label">参数链路（点选任务列表自动填入，也可手填）</span>
      <label class="yunbei-vip-musician--params-item">
        taskId（任务 id → yunbei_task_finish）
        <input v-model="params.taskId" placeholder="← yunbei_tasks / yunbei_tasks_todo 点选" />
      </label>
      <label class="yunbei-vip-musician--params-item">
        songId（歌曲 id → yunbei_rcmd_song）
        <input v-model="params.songId" placeholder="手填歌曲 id" />
      </label>
    </div>

    <div class="yunbei-vip-musician--panel">
      <p class="yunbei-vip-musician--panel-tip">{{ panelTip }}</p>
      <div class="yunbei-vip-musician--grid">
        <!-- 每个接口一个可交互区块，标题标注 module 名 -->
        <section
          v-for="b in visibleBlocks"
          :key="b.module"
          class="yunbei-vip-musician--block"
          :class="{ 'yunbei-vip-musician--block--wide': b.wide }"
        >
          <h3 class="yunbei-vip-musician--block-title">
            <code class="yunbei-vip-musician--module">{{ b.module }}</code> {{ b.name }}
            <span v-if="b.kind === 'invalid'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--invalid">已登记失效</span>
            <span v-else-if="b.kind === 'pending'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--pending">待核·不进主路径</span>
            <span v-else-if="b.kind === 'write' || b.kind === 'upload'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--write">写操作</span>
            <span v-else-if="b.kind === 'loginRead'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--login">需登录只读</span>
          </h3>
          <p v-if="b.note" class="yunbei-vip-musician--note">{{ b.note }}</p>
          <p v-if="(b.kind === 'loginRead' || b.kind === 'write' || b.kind === 'upload') && !hasLogin" class="yunbei-vip-musician--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div class="yunbei-vip-musician--block-actions">
            <label v-if="b.inputKey" class="yunbei-vip-musician--inline-label">
              {{ b.inputLabel || b.inputKey }}
              <input
                :value="params[b.inputKey || '']"
                :placeholder="b.inputHint || '点选上游列表自动填入，或手填'"
                @input="onParamInput(b.inputKey, $event)"
              />
            </label>
            <label v-if="b.kind === 'upload'" class="yunbei-vip-musician--inline-label">
              选择文件<input type="file" @change="onFileChange" />
            </label>
            <button
              class="yunbei-vip-musician--btn"
              :class="{ 'yunbei-vip-musician--btn--write': b.kind === 'write' || b.kind === 'upload' }"
              @click="runBlock(b)"
            >
              {{ b.buttonText || '加载' }}
            </button>
            <span class="yunbei-vip-musician--count">{{ results[b.module]?.length || 0 }} 条</span>
            <span v-if="b.emit" class="yunbei-vip-musician--emit">点选列表项 → 填入 {{ b.emit }}</span>
          </div>
          <div v-if="results[b.module] && results[b.module].length" class="yunbei-vip-musician--list">
            <div
              v-for="(item, idx) in results[b.module]"
              :key="b.module + '_' + idx"
              class="yunbei-vip-musician--item"
              :class="{ 'yunbei-vip-musician--item--clickable': !!b.emit }"
              @click="onItemClick(b, item)"
            >
              <span class="yunbei-vip-musician--item-title">{{ item.title }}</span>
              <span class="yunbei-vip-musician--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="yunbei-vip-musician--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="yunbei-vip-musician--empty">暂无数据或接口返回为空</p>
        </section>
      </div>
      <div v-if="writeResult" class="yunbei-vip-musician--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import yunbeiVipMusicianService from '../../apis/yunbei-vip-musician/yunbei-vip-musician.service';

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

/** 3.1~3.3 按 capability 子任务分 tab */
const tabs = [
  { code: 'c3_1', name: '3.1 云贝积分（11）' },
  { code: 'c3_2', name: '3.2 会员成长（7）' },
  { code: 'c3_3', name: '3.3 音乐人中心（7）' },
];

const panelTips: Record<string, string> = {
  c3_1: '11 个云贝接口：yunbei_info 已登记失效（上游 404，仅手动核验按钮，不进主流程自动请求）；写操作均需登录 + 二次确认 + 不自动；其余需登录只读降级；yunbei_tasks / yunbei_tasks_todo 点选提供 taskId。',
  c3_2: '7 个会员成长接口均为需登录只读，未登录降级不发请求，登录后才请求且失败不影响页面其余部分。',
  c3_3: '7 个音乐人接口，每接口一个可交互区块；musician_sign 为写操作（需登录 + 二次确认 + 不自动），其余需登录只读降级。',
};

const hasLogin = ref<boolean>(checkLogin());
const activeTab = ref<string>('c3_1');
const toast = ref<string>('');
const writeResult = ref<string>('');
const params = reactive<Record<string, string>>({
  taskId: '',
  songId: '',
});
const results = reactive<Record<string, CardItem[]>>({});
const uploadFile = ref<File | null>(null);

/** 25 个接口一一对应 25 个区块，每个 run 即该接口在页面的真实调用点 */
const blocks: Block[] = [
  // 3.1 云贝积分（11）
  { module: 'yunbei', name: '云贝余额/总额', tab: 'c3_1', kind: 'loginRead', run: () => yunbeiVipMusicianService.getYunbei() },
  { module: 'yunbei_info', name: '云贝信息', tab: 'c3_1', kind: 'invalid', buttonText: '查看失效说明/核验', note: '已登记失效（上游 /yunbei/info → api/v1/user/info 404）：不进主流程自动请求，本按钮需二次确认后仅手动核验一次，结果按空值处理', run: () => yunbeiVipMusicianService.getYunbeiInfo() },
  { module: 'yunbei_expense', name: '云贝支出', tab: 'c3_1', kind: 'loginRead', run: () => yunbeiVipMusicianService.getYunbeiExpense() },
  { module: 'yunbei_receipt', name: '云贝收入', tab: 'c3_1', kind: 'loginRead', run: () => yunbeiVipMusicianService.getYunbeiReceipt() },
  { module: 'yunbei_sign', name: '云贝签到（写）', tab: 'c3_1', kind: 'write', buttonText: '签到', note: '写操作：未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用', run: () => yunbeiVipMusicianService.setYunbeiSign() },
  { module: 'yunbei_today', name: '今日云贝', tab: 'c3_1', kind: 'loginRead', run: () => yunbeiVipMusicianService.getYunbeiToday() },
  { module: 'yunbei_rcmd_song', name: '推荐歌曲（写）', tab: 'c3_1', kind: 'write', inputKey: 'songId', inputLabel: '歌曲 id', buttonText: '推荐', run: () => yunbeiVipMusicianService.setYunbeiRcmdSong({ id: params.songId, songId: params.songId }) },
  { module: 'yunbei_rcmd_song_history', name: '推荐歌曲历史', tab: 'c3_1', kind: 'loginRead', run: () => yunbeiVipMusicianService.getYunbeiRcmdSongHistory() },
  { module: 'yunbei_task_finish', name: '完成任务（写）', tab: 'c3_1', kind: 'write', inputKey: 'taskId', inputLabel: '任务 id', buttonText: '完成任务', run: () => yunbeiVipMusicianService.setYunbeiTaskFinish({ id: params.taskId, userTaskId: params.taskId, taskId: params.taskId }) },
  { module: 'yunbei_tasks', name: '云贝任务（taskId 来源）', tab: 'c3_1', kind: 'loginRead', emit: 'taskId', wide: true, run: () => yunbeiVipMusicianService.getYunbeiTasks() },
  { module: 'yunbei_tasks_todo', name: '待办云贝任务（taskId 来源）', tab: 'c3_1', kind: 'loginRead', emit: 'taskId', run: () => yunbeiVipMusicianService.getYunbeiTasksTodo() },
  // 3.2 会员成长（7）
  { module: 'vip_info', name: '会员信息', tab: 'c3_2', kind: 'loginRead', run: () => yunbeiVipMusicianService.getVipInfo() },
  { module: 'vip_info_v2', name: '会员信息 v2', tab: 'c3_2', kind: 'loginRead', run: () => yunbeiVipMusicianService.getVipInfoV2() },
  { module: 'vip_growthpoint', name: '成长值', tab: 'c3_2', kind: 'loginRead', run: () => yunbeiVipMusicianService.getVipGrowthpoint() },
  { module: 'vip_growthpoint_get', name: '成长值获取记录', tab: 'c3_2', kind: 'loginRead', run: () => yunbeiVipMusicianService.getVipGrowthpointGet() },
  { module: 'vip_growthpoint_details', name: '成长值明细', tab: 'c3_2', kind: 'loginRead', run: () => yunbeiVipMusicianService.getVipGrowthpointDetails() },
  { module: 'vip_tasks', name: '会员任务', tab: 'c3_2', kind: 'loginRead', run: () => yunbeiVipMusicianService.getVipTasks() },
  { module: 'vip_timemachine', name: '会员时光机', tab: 'c3_2', kind: 'loginRead', run: () => yunbeiVipMusicianService.getVipTimemachine() },
  // 3.3 音乐人中心（7）
  { module: 'musician_sign', name: '音乐人签到（写）', tab: 'c3_3', kind: 'write', buttonText: '签到', note: '写操作：未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用', run: () => yunbeiVipMusicianService.setMusicianSign() },
  { module: 'musician_tasks', name: '音乐人任务', tab: 'c3_3', kind: 'loginRead', run: () => yunbeiVipMusicianService.getMusicianTasks() },
  { module: 'musician_tasks_new', name: '音乐人新任务', tab: 'c3_3', kind: 'loginRead', run: () => yunbeiVipMusicianService.getMusicianTasksNew() },
  { module: 'musician_cloudbean', name: '音乐人云豆', tab: 'c3_3', kind: 'loginRead', run: () => yunbeiVipMusicianService.getMusicianCloudbean() },
  { module: 'musician_cloudbean_obtain', name: '音乐人云豆获取', tab: 'c3_3', kind: 'loginRead', run: () => yunbeiVipMusicianService.getMusicianCloudbeanObtain() },
  { module: 'musician_data_overview', name: '音乐人数据概览', tab: 'c3_3', kind: 'loginRead', run: () => yunbeiVipMusicianService.getMusicianDataOverview() },
  { module: 'musician_play_trend', name: '音乐人播放趋势', tab: 'c3_3', kind: 'loginRead', run: () => yunbeiVipMusicianService.getMusicianPlayTrend() },
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

/** 列表 → 详情参数来源：点选任务列表项把 id 填入共享参数 */
const onItemClick = (b: Block, item: CardItem) => {
  if (!b.emit) return;
  const id = pickId(item.raw) || item.id;
  if (!id) {
    toast.value = '该条目未返回可用 id';
    return;
  }
  params[b.emit] = String(id);
  toast.value = `已选择 #${id}，已填入共享参数 ${b.emit}，可用于对应写操作`;
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
  // 仅匿名只读读取型接口自动加载；本页全部为需登录/写/失效，故不自动发任何请求
  blocks.filter((b) => b.tab === code && b.auto && b.kind === 'read').forEach((b) => runBlock(b));
};

onMounted(() => switchTab(activeTab.value));
</script>

<style scoped lang="less">
.yunbei-vip-musician {
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
