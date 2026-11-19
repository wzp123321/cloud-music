import type { HV_Result } from '@/apis/server-coverage/high-value.service';

/** 歌单订阅者 */
export interface SubscriberVO {
  id: number | string;
  nickname: string;
  avatarUrl: string;
}

/** 歌单相关推荐 */
export interface RcmdPlaylistVO {
  id: number | string;
  name: string;
  coverImgUrl: string;
  playCount: number;
}

type RawRecord = Record<string, unknown>;

/** 仅普通对象才读字段；数组/基本类型不是有效项 */
const toRecord = (value: unknown): RawRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RawRecord)
    : null;

/** 与 `a ?? b ?? ''` 同义：按别名顺序取第一个字符串值 */
const pickString = (obj: RawRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string') return value;
  }
  return '';
};

/** 兜底顺序按详设：data.<key> → 顶层 <key> → data 本身是数组；keys 为候选别名 */
const pickList = (res: HV_Result | null, keys: string[]): unknown[] => {
  if (!res) return [];
  const data = toRecord(res.data);
  const sources: unknown[] = [];
  for (const key of keys) {
    sources.push(data?.[key], res[key]);
  }
  sources.push(res.data);
  for (const source of sources) {
    if (Array.isArray(source)) return source;
  }
  return [];
};

const pickId = (obj: RawRecord): number | string | null => {
  for (const key of ['id', 'userId', 'user_id']) {
    const value = obj[key];
    if (typeof value === 'number' || typeof value === 'string') return value;
  }
  return null;
};

export const normalizeSubscribers = (res: HV_Result | null): SubscriberVO[] => {
  const result: SubscriberVO[] = [];
  for (const raw of pickList(res, ['subscribers'])) {
    const item = toRecord(raw);
    if (!item) continue;
    const id = pickId(item);
    if (id === null) continue; // 无 id 无法定位用户，丢弃
    result.push({
      id,
      nickname: pickString(item, ['nickname', 'nickName', 'name']),
      avatarUrl: pickString(item, ['avatarUrl', 'avatar', 'headimgUrl']),
    });
  }
  return result;
};

export const normalizeRcmd = (res: HV_Result | null): RcmdPlaylistVO[] => {
  const result: RcmdPlaylistVO[] = [];
  for (const raw of pickList(res, ['recPlaylist', 'playlists'])) {
    const wrapper = toRecord(raw);
    if (!wrapper) continue;
    // 真实响应形如 { playlist: {...}, alg }；同时兼容 item 本身已含 id 的形态
    const item = toRecord(wrapper.playlist) ?? wrapper;
    const id = pickId(item);
    if (id === null) continue; // 无 id 无法跳转详情，丢弃
    const playCount = Number(item.playCount);
    result.push({
      id,
      name: pickString(item, ['name']),
      coverImgUrl: pickString(item, ['coverImgUrl', 'picUrl', 'cover']),
      // VO 要求 number，非法值归零（红心数才返回 null）
      playCount: Number.isFinite(playCount) ? playCount : 0,
    });
  }
  return result;
};
