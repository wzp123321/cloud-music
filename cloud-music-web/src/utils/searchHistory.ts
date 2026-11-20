/**
 * 搜索历史工具：纯本地存储，与账号/登录态无关，不触发任何接口。
 * 存储 key 为 cloud-search-history，值为关键词字符串数组，最多 20 条、去重、最近置顶。
 */

const HISTORY_KEY = 'cloud-search-history';
const MAX_HISTORY = 20;

/** 读取原始历史：非数组、元素非字符串、JSON 损坏均降级为空数组 */
const readHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    // 隐私模式 / 存储不可用 / JSON 损坏：静默降级，不抛错、不弹提示
    return [];
  }
};

/** 写入历史：localStorage 不可用时静默降级 */
const writeHistory = (list: string[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // 静默降级
  }
};

/** 读取搜索历史（最近在前） */
export const getHistory = (): string[] => readHistory();

/** 记录一次搜索：去空白、去重置顶、超出 20 条丢弃最旧；空白不记录 */
export const addHistory = (keyword: string): void => {
  const kw = (keyword ?? '').trim();
  if (!kw) return;
  const next = readHistory().filter((item) => item !== kw);
  next.unshift(kw);
  writeHistory(next.slice(0, MAX_HISTORY));
};

/** 删除单条历史：其余顺序与内容不变 */
export const removeHistory = (keyword: string): void => {
  writeHistory(readHistory().filter((item) => item !== keyword));
};

/** 清空全部历史：写入空数组，刷新后仍为空 */
export const clearHistory = (): void => {
  writeHistory([]);
};
