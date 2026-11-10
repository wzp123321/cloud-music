/*
 * @Description: '杂项长尾' · 接口清单页区块定义（纯数据）
 * 区块渲染交给 cm-api-block，请求编排交给 useApiConsole；本文件只描述接口与参数链路
 */
import type { ApiBlock } from '@/components/cm-api-block/api-block.types';

import miscLongtailService from './misc-longtail.service';

/** 分组 tab：code 与区块的 tab 字段对应 */
export const tabs: { code: string; name: string }[] = [
  { code: '8.1', name: '8.1 杂项与统计（9）' },
];

// ---------- 9 个接口 → 9 个真实调用点区块 ----------
// 写操作：weblog，未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用。
// 需登录只读：calendar，未登录降级；时间参数用 new Date() 生成。
// 待核不进主路径：pl_count（业务异常，仅手动点击触发，不自动加载）。
// 只读可自动加载：inner_version（应用启动版本自检）。

export const blocks: ApiBlock[] = [
  {
    module: 'inner_version', title: '内部版本自检', desc: '只读：应用启动即 onMounted 自动加载，校验前后端版本兼容', tab: '8.1',
    kind: 'read', url: '/inner/version', auto: true,
    params: () => ({}),
    run: miscLongtailService.getInnerVersion,
  },
  {
    module: 'weblog', title: 'Web 日志上报', desc: '写操作：上报 Web 日志（需登录 + 二次确认）', tab: '8.1',
    kind: 'write', url: '/weblog',
    input: { label: '日志内容（手动输入，可选）', def: '' },
    params: (_s, v) => ({ content: v || 'page_view' }),
    confirmMsg: '确认上报 Web 日志（写操作）吗？',
    run: miscLongtailService.sendWeblog,
  },
  {
    module: 'threshold_detail_get', title: '阈值详情', desc: '只读：查询阈值详情', tab: '8.1',
    kind: 'read', url: '/threshold/detail/get',
    params: () => ({}),
    run: miscLongtailService.getThresholdDetail,
  },
  {
    module: 'summary_annual', title: '年度听歌总结', desc: '只读：展示年度听歌数据', tab: '8.1',
    kind: 'read', url: '/summary/annual',
    params: () => ({}),
    run: miscLongtailService.getSummaryAnnual,
  },
  {
    module: 'creator_authinfo_get', title: '创作者认证信息', desc: '只读：查询创作者认证资料', tab: '8.1',
    kind: 'read', url: '/creator/authinfo/get',
    params: () => ({}),
    run: miscLongtailService.getCreatorAuthinfo,
  },
  {
    module: 'pl_count', title: '计数', desc: '待核：业务异常，不进主路径，仅手动点击触发、不自动加载', tab: '8.1',
    kind: 'read', url: '/pl/count',
    params: () => ({}),
    run: miscLongtailService.getPlCount,
  },
  {
    module: 'batch', title: '批量接口', desc: '只读：批量请求入口，参数可手动输入', tab: '8.1',
    kind: 'read', url: '/batch',
    input: { label: '批量参数（可选，手动输入）', def: '' },
    params: (_s, v) => (v ? { data: v } : {}),
    run: miscLongtailService.getBatch,
  },
  {
    module: 'get_userids', title: '用户 ID 查询', desc: '只读：查询用户 ID 列表', tab: '8.1',
    kind: 'read', url: '/get/userids',
    params: () => ({}),
    run: miscLongtailService.getUserids,
  },
  {
    module: 'calendar', title: '日历', desc: '需登录只读：时间参数 startTime/endTime 用 new Date() 生成（不硬编码）', tab: '8.1',
    kind: 'loginRead', url: '/calendar',
    params: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { startTime: start, endTime: now.getTime() };
    },
    run: miscLongtailService.getCalendar,
  },
];
