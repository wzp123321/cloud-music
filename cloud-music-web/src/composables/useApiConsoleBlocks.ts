import { computed, onMounted, reactive, ref, type Ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';

export interface CardItem {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

export type BlockKind = 'read' | 'loginRead' | 'write' | 'upload' | 'pending' | 'invalid';

export interface Block {
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

export interface ApiConsoleTab {
  code: string;
  name: string;
}

export interface ApiConsoleConfig {
  tabs: ApiConsoleTab[];
  panelTips?: Record<string, string>;
  /** 共享参数（reactive）。必须由调用方创建并传入，blocks 闭包与 UI 操作指向同一对象，否则参数无法回流到接口调用 */
  params: Record<string, string>;
  /** 上传文件 ref。含 upload 型区块的页面必须传入，使区块闭包与 onFileChange 共用同一 ref；其余页面可省略 */
  uploadFile?: Ref<File | null>;
  /** 该页全部接口区块，run 即接口在页面的真实调用点 */
  blocks: Block[];
  /** onItemClick 文案尾部描述，默认「详情/写操作」 */
  emitHint?: string;
}

/**
 * 调试台（电台 / 视频播客 / 云贝会员音乐人）公共数据与交互编排。
 * 三个页面仅 tabs / panelTips / params 初始值 / blocks（各自 service）不同，
 * 其余列表抽取、登录降级、写操作二次确认、tab 自动加载等逻辑完全一致，统一在此维护。
 */
export function useApiConsoleBlocks(config: ApiConsoleConfig) {
  const { tabs, panelTips = {}, params, uploadFile = ref<File | null>(null), blocks, emitHint = '详情/写操作' } = config;

  const hasLogin = ref<boolean>(checkLogin());
  const activeTab = ref<string>(tabs[0]?.code ?? '');
  const toast = ref<string>('');
  const writeResult = ref<string>('');
  const results = reactive<Record<string, CardItem[]>>({});

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
    toast.value = `已选择 #${id}，已填入共享参数 ${b.emit}，可用于对应${emitHint}`;
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

  const clearToast = () => {
    toast.value = '';
  };

  onMounted(() => switchTab(activeTab.value));

  return {
    tabs,
    hasLogin,
    activeTab,
    toast,
    writeResult,
    params,
    results,
    uploadFile,
    visibleBlocks,
    panelTip,
    onFileChange,
    onParamInput,
    onItemClick,
    runBlock,
    switchTab,
    clearToast,
  };
}
