/*
 * @Description: '云盘' 接口清单页 · 区块定义
 */
import type { ApiBlock } from '@/components/cm-api-block/api-block.types';

import cloudDiskService from './cloud-disk.service';

/** 分组 tab：code 与区块的 tab 字段对应 */
export const tabs: { code: string; name: string }[] = [
  { code: '6.1', name: '6.1 云盘上传与匹配（2）' },
];

// ---------- 2 个接口 → 2 个真实调用点区块 ----------
// 写操作：cloud（上传，postFormRequest + FormData），未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用。
// 需登录只读：cloud_match，未登录降级，返回可提供 songId 给 cloud 带参。
// 参数来源：cloud 的 songId ← cloud_match 返回或页面输入。

export const blocks: ApiBlock[] = [
  {
    module: 'cloud_match', title: '本地音频匹配', desc: '需登录只读：匹配曲库，返回 songId 提供给 cloud 上传带参', tab: '6.1',
    kind: 'loginRead', url: '/cloud/match', provides: ['songId'],
    input: { label: 'songId（可选，手动输入用于匹配）', def: '' },
    params: (_s, v) => (v ? { songId: v } : {}),
    run: cloudDiskService.matchCloud,
  },
  {
    module: 'cloud', title: '云盘上传', desc: '写操作：postFormRequest + FormData（选择本地音频 + songId）；songId ← cloud_match / 输入', tab: '6.1',
    kind: 'write', url: '/cloud', file: true, fileField: 'songFile',
    needs: 'songId', source: 'cloud_match / 手动输入',
    input: { label: 'songId（默认取参数池 songId，可手动输入）', def: '' },
    params: (s, v) => ({ songId: Number(v) || s.songId || 0 }),
    confirmMsg: '确认上传该本地音频文件到云盘（写操作）吗？',
    run: cloudDiskService.uploadCloud,
  },
];
