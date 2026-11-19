import type { HV_Result } from '@/apis/server-coverage/high-value.service';

/** 百科条目（归一化后） */
export interface SongWikiEntryVO {
  label: string;
  value: string;
}

/** 歌曲百科 VO（归一化后；空 VO 用于驱动区块隐藏） */
export interface SongWikiVO {
  entries: SongWikiEntryVO[];
  summary: string;
}

/** 仅收窄为普通对象：数组/标量不认，避免把字符串当字典读字段 */
const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] | null => (Array.isArray(value) ? value : null);

/** 按别名顺序取首个非空字符串；数字一并转串，保证 VO 字段恒为 string */
const firstString = (obj: Record<string, unknown>, keys: readonly string[]): string => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
};

/** 跳过空串与非标量：Number(null)=0、Number([])=0 会误判成合法红心数 */
const firstFiniteNumber = (values: readonly unknown[]): number | null => {
  for (const value of values) {
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    if (value === '') continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
};

/** rnData 在部分接口是 JSON 字符串，先解析再收窄为普通对象 */
const asRnRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'string') {
    if (value.length === 0) return null;
    try {
      const parsed: unknown = JSON.parse(value);
      return asRecord(parsed);
    } catch {
      return null;
    }
  }
  return asRecord(value);
};

/** 创作人员分散在 wikiSubMetaVos[].text，汇总比取单值更完整；无 metas 时退回标量字段 */
const readEntryValue = (element: Record<string, unknown>): string => {
  const metas = asArray(element.wikiSubMetaVos);
  if (metas) {
    const texts: string[] = [];
    for (const meta of metas) {
      const m = asRecord(meta);
      if (!m) continue;
      const text = firstString(m, ['text', 'name', 'title']);
      if (text !== '') texts.push(text);
    }
    if (texts.length > 0) return texts.join('、');
  }
  return firstString(element, ['content', 'desc', 'text', 'value']);
};

/** data 非对象时才退回顶层，避免顶层字段与 data 字段混读 */
export const normalizeWiki = (res: HV_Result | null): SongWikiVO => {
  const root = res ? (asRecord(res.data) ?? asRecord(res)) : null;
  if (!root) return { entries: [], summary: '' };

  const summary = firstString(root, ['summary', 'intro', 'description']);
  const rawBlocks =
    asArray(root.blocks) ??
    asArray(root.wiki) ??
    asArray(root.entries) ??
    asArray(root.basicInfo) ??
    asArray(root.info);
  if (!rawBlocks) return { entries: [], summary };

  const entries: SongWikiEntryVO[] = [];
  for (const raw of rawBlocks) {
    const block = asRecord(raw);
    if (!block) continue;
    const rn = asRnRecord(block.rnData);
    if (!rn) continue;
    const rnBlocks = asArray(rn.blocks);
    if (!rnBlocks) continue;
    for (const rawSub of rnBlocks) {
      const sub = asRecord(rawSub);
      if (!sub) continue;
      const info = asRecord(sub.blockInfo);
      if (!info) continue;
      const elements = asArray(info.wikiSubElementVos);
      if (!elements) continue;
      for (const rawEl of elements) {
        const el = asRecord(rawEl);
        if (!el) continue;
        const label = firstString(el, ['title', 'showTitle', 'blockName', 'label', 'name', 'key']);
        const value = readEntryValue(el);
        // 缺任一侧即非完整键值对，按「字段缺失不展示对应条目」丢弃
        if (label === '' || value === '') continue;
        entries.push({ label, value });
      }
    }
  }
  return { entries, summary };
};

/** 兼容 data.count / 裸 data / 顶层 count 三种包裹及数字或字符串值 */
export const normalizeRedCount = (res: HV_Result | null): number | null => {
  if (!res) return null;
  const data = asRecord(res.data);
  return firstFiniteNumber([
    data?.count,
    res.data,
    res.count,
    res.redCount,
    res.likedCount,
  ]);
};
