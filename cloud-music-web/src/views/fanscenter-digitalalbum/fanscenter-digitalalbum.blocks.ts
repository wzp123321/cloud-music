/*
 * @Description: '粉丝中心与数字专辑' · 接口清单页区块定义（纯数据）
 * 区块渲染交给 cm-api-block，请求编排交给 useApiConsole；本文件只描述接口与参数链路
 */
import type { ApiBlock } from '@/components/cm-api-block/api-block.types';

import fanscenterDigitalalbumService from '../../apis/fanscenter-digitalalbum/fanscenter-digitalalbum.service';

/** 分组 tab：code 与区块的 tab 字段对应 */
export const tabs: { code: string; name: string }[] = [
  { code: '5.1', name: '5.1 粉丝中心（5）' },
  { code: '5.2', name: '5.2 数字专辑（4）' },
];

// ---------- 9 个接口 → 9 个真实调用点区块 ----------
// 需登录只读：fanscenter_*（5）/ digitalAlbum_purchased，未登录降级。
// 待核不进主路径：digitalAlbum_detail / digitalAlbum_sales（需有效 id，仅手动输入触发，不自动加载）。
// 写操作：digitalAlbum_ordering，未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用。
// 参数来源：detail/sales/ordering 的 id ← digitalAlbum_purchased 返回或页面输入。

const albumIdInput = { label: '专辑 id（默认取参数池 albumId，可手动输入；detail/sales 需有效 id）', def: '' };
const albumIdParams = (s: Record<string, any>, v: string): Record<string, any> => ({
  id: Number(v) || s.albumId || 0,
});

export const blocks: ApiBlock[] = [
  // 5.1 粉丝中心（5，均需登录只读）
  {
    module: 'fanscenter_overview_get', title: '粉丝概览', desc: '需登录只读：粉丝总数与概览', tab: '5.1',
    kind: 'loginRead', url: '/fanscenter/overview/get',
    run: fanscenterDigitalalbumService.getFansOverview,
  },
  {
    module: 'fanscenter_basicinfo_age_get', title: '粉丝画像-年龄', desc: '需登录只读：粉丝年龄分布', tab: '5.1',
    kind: 'loginRead', url: '/fanscenter/basicinfo/age/get',
    run: fanscenterDigitalalbumService.getFansAge,
  },
  {
    module: 'fanscenter_basicinfo_gender_get', title: '粉丝画像-性别', desc: '需登录只读：粉丝性别分布', tab: '5.1',
    kind: 'loginRead', url: '/fanscenter/basicinfo/gender/get',
    run: fanscenterDigitalalbumService.getFansGender,
  },
  {
    module: 'fanscenter_basicinfo_province_get', title: '粉丝画像-省份', desc: '需登录只读：粉丝地域分布', tab: '5.1',
    kind: 'loginRead', url: '/fanscenter/basicinfo/province/get',
    run: fanscenterDigitalalbumService.getFansProvince,
  },
  {
    module: 'fanscenter_trend_list', title: '粉丝趋势', desc: '需登录只读：粉丝增长趋势列表', tab: '5.1',
    kind: 'loginRead', url: '/fanscenter/trend/list',
    input: { label: 'limit（可选，手动输入）', def: '' },
    params: (_s, v) => (v ? { limit: Number(v) } : {}),
    run: fanscenterDigitalalbumService.getFansTrend,
  },

  // 5.2 数字专辑（4）
  {
    module: 'digitalAlbum_purchased', title: '已购数字专辑', desc: '需登录只读：返回项 albumId 提供给 detail/sales/ordering 带参', tab: '5.2',
    kind: 'loginRead', url: '/digitalAlbum/purchased', provides: ['albumId'],
    run: fanscenterDigitalalbumService.getDigitalAlbumPurchased,
  },
  {
    module: 'digitalAlbum_detail', title: '数字专辑详情', desc: '待核：需有效 id，不进主路径，仅手动输入 id 点击触发；id ← digitalAlbum_purchased / 输入', tab: '5.2',
    kind: 'read', url: '/digitalAlbum/detail', needs: 'albumId', source: 'digitalAlbum_purchased / 手动输入',
    input: albumIdInput, params: albumIdParams,
    run: fanscenterDigitalalbumService.getDigitalAlbumDetail,
  },
  {
    module: 'digitalAlbum_sales', title: '数字专辑销量', desc: '待核：需有效 id，不进主路径，仅手动输入 id 点击触发；id ← digitalAlbum_purchased / 输入', tab: '5.2',
    kind: 'read', url: '/digitalAlbum/sales', needs: 'albumId', source: 'digitalAlbum_purchased / 手动输入',
    input: albumIdInput, params: albumIdParams,
    run: fanscenterDigitalalbumService.getDigitalAlbumSales,
  },
  {
    module: 'digitalAlbum_ordering', title: '数字专辑下单', desc: '写操作：下单（需登录 + 二次确认）；id ← digitalAlbum_purchased / 输入', tab: '5.2',
    kind: 'write', url: '/digitalAlbum/ordering', needs: 'albumId', source: 'digitalAlbum_purchased / 手动输入',
    input: albumIdInput, params: albumIdParams,
    confirmMsg: '确认提交数字专辑下单（写操作）吗？',
    run: fanscenterDigitalalbumService.orderDigitalAlbum,
  },
];
