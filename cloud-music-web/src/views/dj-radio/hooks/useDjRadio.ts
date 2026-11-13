import { reactive } from 'vue';

import djRadioService from '@/apis/dj-radio/dj-radio.service';
import { Block, useApiConsoleBlocks } from '@/composables/useApiConsoleBlocks';

/**
 * 电台 · 分类 · 节目 · 榜单（P1 1.1~1.4）调试台。
 * 数据与交互编排统一交给 useApiConsoleBlocks，本 hook 只声明本页专属配置。
 */
export const useDjRadio = () => {
  /** 1.1~1.4 按 capability 子任务分 tab */
  const tabs = [
    { code: 'c1_1', name: '1.1 电台发现（9）' },
    { code: 'c1_2', name: '1.2 电台与节目（6）' },
    { code: 'c1_3', name: '1.3 订阅与榜单（9）' },
    { code: 'c1_4', name: '1.4 推荐与匹配（3）' },
  ];

  const panelTips: Record<string, string> = {
    c1_1: '9 个匿名只读发现型接口，每接口一个可交互区块，标题标注 module 名；dj_catelist 列表点选提供 cateId，dj_hot / dj_recommend 列表点选提供 rid。',
    c1_2: '详情链路：rid ← 1.1 电台列表点选；cateId ← dj_catelist；dj_program 加载后点选 programs 项得到 programId ← dj_program_detail；列表点击带参再请求详情。',
    c1_3: 'dj_sub 为写操作（未登录降级 + window.confirm 二次确认 + 禁止 onMounted 自动调用）；dj_sublist 需登录只读降级；5 个 toplist 返回项均作为 rid 来源。',
    c1_4: 'program_recommend 常规接入；aidj_content_rcmd 为待核接口，不进主路径（手动按钮 + 输入框）；audio_match 手动带 id 触发。',
  };

  const params = reactive<Record<string, string>>({
    rid: '',
    cateId: '',
    programId: '',
    recommendType: '',
    aidjId: '',
    matchId: '',
  });

  /** 27 个接口一一对应 27 个区块，每个 run 即该接口在页面的真实调用点 */
  const blocks: Block[] = [
    // 1.1 电台发现（9）
    { module: 'dj_catelist', name: '电台分类（cateId 来源）', tab: 'c1_1', kind: 'read', emit: 'cateId', auto: true, wide: true, run: () => djRadioService.getDjCatelist() },
    { module: 'dj_category_recommend', name: '分类推荐', tab: 'c1_1', kind: 'read', inputKey: 'cateId', inputLabel: 'cateId', run: () => djRadioService.getDjCategoryRecommend({ cateId: Number(params.cateId) || undefined }) },
    { module: 'dj_category_excludehot', name: '分类冷门', tab: 'c1_1', kind: 'read', run: () => djRadioService.getDjCategoryExcludehot() },
    { module: 'dj_banner', name: '电台轮播', tab: 'c1_1', kind: 'read', auto: true, run: () => djRadioService.getDjBanner() },
    { module: 'dj_hot', name: '热门电台（rid 来源）', tab: 'c1_1', kind: 'read', emit: 'rid', auto: true, run: () => djRadioService.getDjHot({ limit: 30 }) },
    { module: 'dj_recommend', name: '推荐电台（rid 来源）', tab: 'c1_1', kind: 'read', emit: 'rid', auto: true, run: () => djRadioService.getDjRecommend() },
    { module: 'dj_recommend_type', name: '分类类型推荐', tab: 'c1_1', kind: 'read', inputKey: 'recommendType', inputLabel: 'type', run: () => djRadioService.getDjRecommendType({ type: Number(params.recommendType) || undefined }) },
    { module: 'dj_personalize_recommend', name: '个性化推荐', tab: 'c1_1', kind: 'read', run: () => djRadioService.getDjPersonalizeRecommend({ limit: 30 }) },
    { module: 'dj_today_perfered', name: '今日优选', tab: 'c1_1', kind: 'read', auto: true, run: () => djRadioService.getDjTodayPerfered() },
    // 1.2 电台与节目（6）
    { module: 'dj_detail', name: '电台详情', tab: 'c1_2', kind: 'read', inputKey: 'rid', inputLabel: 'rid', run: () => djRadioService.getDjDetail({ rid: Number(params.rid) || 0 }) },
    { module: 'dj_program', name: '电台节目（programId 来源）', tab: 'c1_2', kind: 'read', inputKey: 'rid', inputLabel: 'rid', emit: 'programId', wide: true, run: () => djRadioService.getDjProgram({ rid: Number(params.rid) || 0, limit: 30 }) },
    { module: 'dj_program_detail', name: '节目详情', tab: 'c1_2', kind: 'read', inputKey: 'programId', inputLabel: '节目 id', run: () => djRadioService.getDjProgramDetail({ id: Number(params.programId) || 0 }) },
    { module: 'dj_program_toplist', name: '节目榜单', tab: 'c1_2', kind: 'read', run: () => djRadioService.getDjProgramToplist({ limit: 30 }) },
    { module: 'dj_program_toplist_hours', name: '节目小时榜', tab: 'c1_2', kind: 'read', run: () => djRadioService.getDjProgramToplistHours({ limit: 30 }) },
    { module: 'dj_radio_hot', name: '分类热门电台', tab: 'c1_2', kind: 'read', inputKey: 'cateId', inputLabel: 'cateId', run: () => djRadioService.getDjRadioHot({ cateId: Number(params.cateId) || 0, limit: 30 }) },
    // 1.3 订阅与榜单（9）
    { module: 'dj_sub', name: '订阅电台（写）', tab: 'c1_3', kind: 'write', inputKey: 'rid', inputLabel: 'rid', buttonText: '订阅(t=1)', run: () => djRadioService.setDjSub({ rid: Number(params.rid) || 0, t: 1 }) },
    { module: 'dj_sublist', name: '我的订阅电台', tab: 'c1_3', kind: 'login-read', run: () => djRadioService.getDjSublist({ limit: 30 }) },
    { module: 'dj_subscriber', name: '电台订阅者', tab: 'c1_3', kind: 'read', inputKey: 'rid', inputLabel: 'rid', run: () => djRadioService.getDjSubscriber({ rid: Number(params.rid) || 0, limit: 30 }) },
    { module: 'dj_paygift', name: '电台付费礼物', tab: 'c1_3', kind: 'read', run: () => djRadioService.getDjPaygift({ limit: 30 }) },
    { module: 'dj_toplist', name: '电台榜（rid 来源）', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplist({ limit: 30 }) },
    { module: 'dj_toplist_hours', name: '电台小时榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistHours({ limit: 30 }) },
    { module: 'dj_toplist_newcomer', name: '电台新人榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistNewcomer({ limit: 30 }) },
    { module: 'dj_toplist_pay', name: '电台付费榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistPay({ limit: 30 }) },
    { module: 'dj_toplist_popular', name: '电台热门榜', tab: 'c1_3', kind: 'read', emit: 'rid', run: () => djRadioService.getDjToplistPopular({ limit: 30 }) },
    // 1.4 推荐与匹配（3）
    { module: 'program_recommend', name: '推荐节目', tab: 'c1_4', kind: 'read', run: () => djRadioService.getProgramRecommend({ limit: 30 }) },
    { module: 'aidj_content_rcmd', name: 'AI DJ 内容推荐', tab: 'c1_4', kind: 'pending', inputKey: 'aidjId', inputLabel: '内容 id / 关键词', buttonText: '手动查看', note: '待核：业务异常，不进主路径，仅手动按钮 + 输入框触发，不做自动请求', run: () => djRadioService.getAidjContentRcmd({ id: params.aidjId, keyword: params.aidjId }) },
    { module: 'audio_match', name: '音频匹配', tab: 'c1_4', kind: 'read', inputKey: 'matchId', inputLabel: '音频 id', note: '手动触发，id 可来自上方列表或手填', run: () => djRadioService.getAudioMatch({ id: Number(params.matchId) || 0 }) },
  ];

  return useApiConsoleBlocks({ tabs, panelTips, params, blocks });
}
