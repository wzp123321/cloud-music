/*
 * @Description: 用户资料补充台 · 共享类型与归一工具
 * 该页面面向「接口清单可视化」，各接口返回结构不统一，这里统一压成卡片结构再渲染
 */
import type { Ref } from 'vue';

/** 列表卡片：展示只需要标题 / 副标题 / 图标 / id 四个位 */
export interface SupplementCard {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  raw: any;
}

/** 写操作结果文案（各面板共用同一份格式） */
export const formatWriteResult = (label: string, res: any): string => {
  const obj = extractObj(res);
  return `${label} 已提交｜code=${obj.code ?? res?.code ?? '—'}｜${obj.message ?? res?.message ?? '无附加信息'}`;
};

/** 兼容 res.data / res.result / res.list / res.playlist / res.xxx / res.data.list 等多种结构 */
export const extractList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const candidates = [
    res.data,
    res.result,
    res.list,
    res.playlist,
    res.playlists,
    res.songs,
    res.records,
    res.events,
    res.comments,
    res.videos,
    res.albums,
    res.data?.list,
    res.result?.list,
    res.data?.data,
    res.data?.records,
    res.data?.playlist,
    res.data?.songs,
  ];
  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }
  for (const key of Object.keys(res)) {
    if (Array.isArray(res[key])) return res[key];
  }
  return [];
};

export const extractObj = (res: any): Record<string, any> => {
  if (!res) return {};
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res.result && typeof res.result === 'object' && !Array.isArray(res.result)) return res.result;
  return res;
};

/** 单条原始对象 → 卡片 */
export const toCard = (raw: any): SupplementCard => {
  const r = raw || {};
  const id = Number(r.id ?? r.songId ?? r.playlistId ?? r.uid ?? r.userId ?? r.commentId ?? 0) || 0;
  const title = String(r.title ?? r.name ?? r.songName ?? r.nickname ?? r.content ?? r.msg ?? '未命名');
  const cover = String(
    r.cover ?? r.coverUrl ?? r.picUrl ?? r.avatarUrl ?? r.coverImgUrl ?? r.imgUrl ?? '',
  );
  const subtitle = String(
    r.subtitle ??
      r.artist ??
      r.album ??
      r.desc ??
      r.description ??
      r.creator?.nickname ??
      r.user?.nickname ??
      '',
  );
  return { id, title, cover, subtitle, raw: r };
};

/** 列表型归一；详情型对象包成一条卡片，保证有内容可展示 */
export const toList = (res: any): SupplementCard[] => {
  const list = extractList(res);
  if (list.length) return list.map(toCard);
  const obj = extractObj(res);
  if (obj && Object.keys(obj).length) {
    return [
      toCard({
        ...obj,
        title: obj.title ?? obj.name ?? obj.content ?? `响应 code=${obj.code ?? '—'}`,
      }),
    ];
  }
  return [];
};

/** 云盘文件 → songId（详情 / 删除接口的入参来源） */
export const pickSongId = (raw: any): number => {
  const r = raw || {};
  return Number(r.songId ?? r.id ?? r.songid ?? 0) || 0;
};

/** 歌单 → playlistId（9 个 playlist_* 接口的入参来源） */
export const pickPlaylistId = (raw: any): number => {
  const r = raw || {};
  return Number(r.id ?? r.playlistId ?? 0) || 0;
};

export interface SupplementGuardOptions {
  /** 当前登录态（来自 props，用函数取以保持响应式） */
  hasLogin: () => boolean;
  /** 提示文案回传给父级统一展示 */
  setToast: (message: string) => void;
}

/**
 * 只读 / 写操作守卫：
 * - 只读：未登录直接降级，不发请求
 * - 写操作：未登录降级 + 二次确认，避免误触提交
 */
export const useSupplementGuard = ({ hasLogin, setToast }: SupplementGuardOptions) => {
  const requireLogin = (): boolean => {
    if (!hasLogin()) {
      setToast('该接口需要登录后才能查看（已降级，不发请求）');
      return false;
    }
    return true;
  };

  const writeGuard = (confirmText: string): boolean => {
    if (!hasLogin()) {
      setToast('请先登录后再执行该写操作（已降级，不发请求）');
      return false;
    }
    if (!window.confirm(confirmText)) {
      setToast('已取消操作');
      return false;
    }
    return true;
  };

  return { requireLogin, writeGuard };
};

/** 统一写操作执行：守卫 → 请求 → 结果落到面板内的 writeResult */
export const useWriteRunner = (
  writeResult: Ref<string>,
  writeGuard: (confirmText: string) => boolean,
) => {
  return async (label: string, fn: () => Promise<any>) => {
    if (!writeGuard(`确定执行「${label}」吗？该操作会向服务端提交数据。`)) return;
    try {
      const res = await fn();
      writeResult.value = formatWriteResult(label, res);
    } catch {
      writeResult.value = `${label} 请求失败，已按空值处理`;
    }
  };
};
