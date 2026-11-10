/*
 * @Description: 接口调用台区块 · 类型定义
 * 「一个接口 = 一个区块」，页面只提供数据，渲染与请求态展示由 cm-api-block 负责
 */

/** 区块类型：读取 / 需登录只读 / 写操作 */
export type BlockKind = 'read' | 'loginRead' | 'write';

/** 列表卡片：各接口返回结构不一，统一压成这四个展示位 */
export interface BlockCard {
  id: any;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

/** 每个区块独立的请求态 */
export interface BlockState {
  loading: boolean;
  loaded: boolean;
  cards: BlockCard[];
  raw: any;
  tip: string;
}

/** 一个接口 = 一个区块 */
export interface ApiBlock {
  /** 接口 module 名，同时作为区块唯一 key */
  module: string;
  title: string;
  desc: string;
  tab: string;
  kind: BlockKind;
  url: string;
  /** 切到该分组时是否自动请求（仅读取型来源列表可开） */
  auto?: boolean;
  /** 页面挂载时是否预取（用于给详情接口预填 id） */
  preload?: boolean;
  input?: { label: string; def?: string };
  /** 是否有文件选择框（上传类接口） */
  file?: boolean;
  /** 上传字段名，默认 songFile */
  fileField?: string;
  /** 该接口返回的 id 可提供给下游哪些参数 */
  provides?: string[];
  /** 该接口需要上游哪个参数 */
  needs?: string;
  source?: string;
  confirmMsg?: string;
  params?: (sel: Record<string, any>, v: string) => Record<string, any>;
  run: (p: any) => Promise<any>;
}

/** 默认的区块类型文案 */
export const DEFAULT_KIND_LABELS: Record<BlockKind, string> = {
  read: '读取',
  loginRead: '需登录只读',
  write: '写操作',
};
