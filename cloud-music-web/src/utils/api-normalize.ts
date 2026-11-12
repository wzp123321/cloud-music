/**
 * 接口响应归一：各调试台接口返回结构不统一，统一压成卡片后再渲染。
 * 抽取算法集中在此；字段优先级由调用方以配置传入，保证各页面原有行为不变。
 */

/** 列表卡片：展示只需要这四个位，raw 保留原始对象供参数回填 */
export interface ApiCard {
  id: any;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

/** 详情 / 写操作返回兼容 res.data / res.result / res 本身 */
export const extractObject = (res: any): Record<string, any> => {
  if (!res) return {};
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res.result && typeof res.result === 'object' && !Array.isArray(res.result)) return res.result;
  return res;
};

/**
 * BFS 版列表抽取：先按 listKeys 逐层命中，再兜底找任意嵌套数组。
 * cm-api-block 的接口清单页用这个版本，能覆盖字段极不固定的上游返回。
 */
export const pickListBfs = (res: any, listKeys: string[]): any[] => {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  const seen = new Set<any>();
  const queue: any[] = [res];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);
    if (Array.isArray(cur)) return cur;
    for (const key of listKeys) {
      if (Array.isArray(cur[key])) return cur[key];
    }
    for (const key of Object.keys(cur)) {
      const child = cur[key];
      if (child && typeof child === 'object') queue.push(child);
    }
  }
  return [];
};

/** 候选路径生成函数：由调用方按自身接口字段声明 */
export type ListCandidates = any[] | ((res: any) => any[]);

/**
 * 候选路径版列表抽取：先按候选数组命中，再扫响应顶层 key；
 * scanNested 打开后额外扫 data / result 的内层 key。
 */
export const extractListByCandidates = (
  res: any,
  candidates: ListCandidates,
  scanNested = false,
): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const list = typeof candidates === 'function' ? candidates(res) : candidates;
  for (const item of list) {
    if (Array.isArray(item)) return item;
  }
  for (const key of Object.keys(res)) {
    if (Array.isArray(res[key])) return res[key];
  }
  if (scanNested) {
    for (const obj of [res.data, res.result]) {
      if (obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          if (Array.isArray(obj[key])) return obj[key];
        }
      }
    }
  }
  return [];
};

/** 列表型返回归一；详情型返回对象时包成一条卡片，保证有内容可展示 */
export const toCardList = <T extends ApiCard>(
  res: any,
  candidates: ListCandidates,
  toCard: (raw: any) => T,
  fallbackTitle: (obj: Record<string, any>, res: any) => string,
  scanNested = false,
): T[] => {
  const list = extractListByCandidates(res, candidates, scanNested);
  if (list.length) return list.map(toCard);
  const obj = extractObject(res);
  if (obj && Object.keys(obj).length) {
    return [toCard({ ...obj, title: fallbackTitle(obj, res) })];
  }
  return [];
};

/** 按字段优先级取第一个非 null 的 id 并转 number；无可用值回落 0 */
export const pickNumberId = (raw: any, keys: string[]): number => {
  const r = raw || {};
  for (const key of keys) {
    const value = r[key];
    if (value != null) return Number(value) || 0;
  }
  return 0;
};

/** 原始返回格式化：循环引用等异常时退化为字符串 */
export const prettyJson = (raw: any): string => {
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
};
