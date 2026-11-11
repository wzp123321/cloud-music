/*
 * @Description: 接口调用台 · 通用状态与请求编排
 * 三个「接口清单」页面（账号资料 / 歌曲互动 / UGC 一起听）结构一致：
 * 分组 tab + 参数池 + 每接口一份请求态。渲染交给 cm-api-block，这里只管数据流。
 *
 * 安全约定：
 * - 需登录只读 / 写操作：未登录直接降级，不发请求
 * - 写操作：必须用户点击 + window.confirm 二次确认，且绝不在 onMounted 自动调用
 */
import { computed, onMounted, reactive, ref } from 'vue';

import { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';

import { captureProvided, normalize } from './api-block.util';
import type { ApiBlock, BlockCard, BlockState } from './api-block.types';

export interface ApiConsoleOptions {
  /** 初始分组，默认取第一个 tab */
  initialTab?: string;
}

export const useApiConsole = (blocks: ApiBlock[], options: ApiConsoleOptions = {}) => {
  const loggedIn = checkLogin();
  const activeTab = ref<string>(options.initialTab ?? blocks[0]?.tab ?? '');

  // 参数池：自动收集所有 needs / provides 的 key，值来自上游列表点击项或手动输入
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

  /** 执行一个区块的接口调用：登录降级 / 写操作二次确认 / 失败降级空值 / 归一化 */
  const runBlock = async (block: ApiBlock): Promise<void> => {
    const st = states[block.module];
    if (!st || st.loading) return;

    // 需登录只读 / 写操作：未登录降级，不发请求
    if ((block.kind === 'write' || block.kind === 'loginRead') && !checkLogin()) {
      st.tip = '登录后可用（未登录，已降级，未发送请求）';
      return;
    }
    // 写操作：用户点击后必须二次确认，确认后才调用
    if (block.kind === 'write') {
      const ok = window.confirm(
        block.confirmMsg || `确认执行写操作【${block.title}｜${block.module}】吗？`,
      );
      if (!ok) {
        st.tip = '已取消，未发送请求';
        return;
      }
    }

    const inputVal = inputs[block.module] ?? '';
    let payload: any;
    if (block.file) {
      // 上传类接口：参数平铺进 FormData
      const formData = new FormData();
      const base = block.params ? block.params(sel, inputVal) || {} : {};
      Object.keys(base).forEach((key) => formData.append(key, String(base[key])));
      const file = files[block.module];
      if (file) formData.append(block.fileField || 'songFile', file);
      payload = formData;
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
      // 上游接口的 id 自动进参数池，下游详情接口即可带参
      captureProvided(block.provides, st.cards, st.raw, sel);
      if (!st.cards.length) {
        st.tip =
          block.kind === 'write'
            ? '写操作已提交（无列表返回，详见原始返回）'
            : '请求完成（非列表返回，详见原始返回）';
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
  };

  /** 列表点击带参：把上游返回项的 id 写入参数池 */
  const onCardClick = (block: ApiBlock, card: BlockCard): void => {
    if (!block.provides || !block.provides.length) return;
    block.provides.forEach((key) => {
      sel[key] = card.id;
    });
    states[block.module].tip = `已选中 id=${card.id}（${block.provides.join(' / ')}），现在可点击下游详情接口按钮带参请求`;
  };

  /** 上传类文件选择 */
  const onFileChange = (block: ApiBlock, file: File | null): void => {
    files[block.module] = file;
  };

  /** 切到某分组时，仅自动加载该分组的读取型「来源列表」区块 */
  const loadAutoTab = (code: string): void => {
    blocks
      .filter((block) => block.tab === code && block.auto && block.kind === 'read')
      .forEach((block) => runBlock(block));
  };

  const switchTab = (code: string): void => {
    if (activeTab.value === code) return;
    activeTab.value = code;
    loadAutoTab(code);
  };

  onMounted(() => {
    // 预取来源列表（用于给详情接口预填 id）；写操作 / 需登录接口绝不自动触发
    blocks.filter((block) => block.preload).forEach((block) => runBlock(block));
    loadAutoTab(activeTab.value);
  });

  return {
    loggedIn,
    activeTab,
    activeBlocks,
    sel,
    selKeys,
    inputs,
    states,
    runBlock,
    onCardClick,
    onFileChange,
    switchTab,
  };
};
