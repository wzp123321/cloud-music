/*
 * @Description: 接口调用台 · 返回结构归一化
 * 接口返回结构五花八门（res.data / res.result / res.xxx），这里统一捞出第一个数组并映射成卡片
 */
import type { BlockCard } from './api-block.types';
import { pickListBfs, prettyJson } from '@/utils/api-normalize';

/** 常见列表字段名，按优先级探测（取各接口并集，命中即返回） */
const LIST_KEYS = [
  'data',
  'result',
  'list',
  'records',
  'songs',
  'albums',
  'artists',
  'playlists',
  'products',
  'mvs',
  'mv',
  'djRadios',
  'djprogram',
  'djPrograms',
  'topics',
  'content',
  'items',
  'feeds',
  'threads',
  'comments',
  'resources',
  'dataList',
  'songlist',
  'playRecordList',
  'weekData',
  'allData',
  'userlist',
  'data_list',
  'countryList',
  'countries',
  'codeList',
];

/** 在响应体（含 data / result / 任意嵌套）中找出第一个数组作为列表 */
export const pickList = (res: any): any[] => pickListBfs(res, LIST_KEYS);

const pickId = (raw: any, index: number): any => {
  const r = raw ?? {};
  return (
    r.id ??
    r.songId ??
    r.rid ??
    r.vid ??
    r.mvid ??
    r.userId ??
    r.programId ??
    r.resourceId ??
    r.topicId ??
    r.actid ??
    r.artistId ??
    r.albumId ??
    r.playlistId ??
    r.roomId ??
    r.ugcId ??
    r.targetId ??
    r.data?.id ??
    r.song?.id ??
    index
  );
};

const pickTitle = (raw: any, index: number): string => {
  const r = raw ?? {};
  const t =
    r.name ??
    r.title ??
    r.nickname ??
    r.songName ??
    r.albumName ??
    r.playlistName ??
    r.desc ??
    r.content ??
    r.text ??
    r.message ??
    r.keyword ??
    r.countryName ??
    r.label ??
    r.song?.name ??
    r.data?.name;
  return String(t ?? `条目 ${index + 1}`);
};

const pickCover = (raw: any): string => {
  const r = raw ?? {};
  return String(
    r.cover ??
      r.coverUrl ??
      r.picUrl ??
      r.imgurl ??
      r.img1v1Url ??
      r.imageUrl ??
      r.avatarUrl ??
      r.coverImgUrl ??
      r.blurPicUrl ??
      r.avatar ??
      r.al?.picUrl ??
      r.album?.picUrl ??
      r.song?.al?.picUrl ??
      '',
  );
};

const pickSubtitle = (raw: any): string => {
  const r = raw ?? {};
  const artist =
    r.artistName ??
    r.creator?.nickname ??
    r.user?.nickname ??
    r.dj?.nickname ??
    r.ar?.[0]?.name ??
    r.artists?.[0]?.name ??
    r.artist?.name ??
    r.song?.ar?.[0]?.name ??
    '';
  const play = r.playCount ?? r.playcount ?? r.playCnt;
  const extra = r.subtitle ?? r.briefDesc ?? r.description ?? r.reason ?? r.playTime;
  const parts = [artist, play ? `播放 ${play}` : '', extra].filter(Boolean);
  return parts.join(' · ').slice(0, 80);
};

/** 统一归一为 { id, title, cover, subtitle } 再渲染，最多 30 条 */
export const normalize = (res: any): BlockCard[] => {
  return pickList(res)
    .slice(0, 30)
    .map((raw, index) => ({
      id: pickId(raw, index),
      title: pickTitle(raw, index),
      cover: pickCover(raw),
      subtitle: pickSubtitle(raw),
      raw,
    }));
};

/** 原始返回格式化：循环引用等异常时退化为字符串 */
export const pretty = prettyJson;

/**
 * 把上游返回里的 id / unikey / key 写进参数池：
 * 列表型取首项 id，非列表型从响应体顶层字段兜底（二维码 key 这类场景）
 */
export const captureProvided = (
  provides: string[] | undefined,
  cards: BlockCard[],
  raw: any,
  sel: Record<string, any>,
): void => {
  if (!provides || !provides.length) return;
  let id: any = cards.length ? cards[0].id : undefined;
  if (id == null) {
    const r = raw ?? {};
    id =
      r.unikey ??
      r.key ??
      r.qrKey ??
      r.data?.unikey ??
      r.data?.key ??
      r.data?.qrKey ??
      r.result?.unikey ??
      r.result?.key ??
      r.roomId ??
      r.songId ??
      r.albumId ??
      r.id ??
      r.data?.id;
  }
  if (id != null && id !== 0 && id !== '') {
    provides.forEach((key) => {
      sel[key] = id;
    });
  }
};
