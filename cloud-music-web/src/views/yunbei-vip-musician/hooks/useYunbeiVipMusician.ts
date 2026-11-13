import { reactive } from 'vue';

import yunbeiVipMusicianService from '@/apis/yunbei-vip-musician/yunbei-vip-musician.service';
import { Block, useApiConsoleBlocks } from '@/composables/useApiConsoleBlocks';

/**
 * 云贝 · 会员成长 · 音乐人中心（P1 3.1~3.3）调试台。
 * 数据与交互编排统一交给 useApiConsoleBlocks，本 hook 只声明本页专属配置。
 */
export const useYunbeiVipMusician = () => {
  /** 3.1~3.3 按 capability 子任务分 tab */
  const tabs = [
    { code: 'c3_1', name: '3.1 云贝积分（11）' },
    { code: 'c3_2', name: '3.2 会员成长（7）' },
    { code: 'c3_3', name: '3.3 音乐人中心（7）' },
  ];

  const panelTips: Record<string, string> = {
    c3_1: '11 个云贝接口：yunbei_info 已登记失效（上游 404，仅手动核验按钮，不进主流程自动请求）；写操作均需登录 + 二次确认 + 不自动；其余需登录只读降级；yunbei_tasks / yunbei_tasks_todo 点选提供 taskId。',
    c3_2: '7 个会员成长接口均为需登录只读，未登录降级不发请求，登录后才请求且失败不影响页面其余部分。',
    c3_3: '7 个音乐人接口，每接口一个可交互区块；musician_sign 为写操作（需登录 + 二次确认 + 不自动），其余需登录只读降级。',
  };

  const params = reactive<Record<string, string>>({
    taskId: '',
    songId: '',
  });

  /** 25 个接口一一对应 25 个区块，每个 run 即该接口在页面的真实调用点 */
  const blocks: Block[] = [
    // 3.1 云贝积分（11）
    { module: 'yunbei', name: '云贝余额/总额', tab: 'c3_1', kind: 'login-read', run: () => yunbeiVipMusicianService.getYunbei() },
    { module: 'yunbei_info', name: '云贝信息', tab: 'c3_1', kind: 'invalid', buttonText: '查看失效说明/核验', note: '已登记失效（上游 /yunbei/info → api/v1/user/info 404）：不进主流程自动请求，本按钮需二次确认后仅手动核验一次，结果按空值处理', run: () => yunbeiVipMusicianService.getYunbeiInfo() },
    { module: 'yunbei_expense', name: '云贝支出', tab: 'c3_1', kind: 'login-read', run: () => yunbeiVipMusicianService.getYunbeiExpense() },
    { module: 'yunbei_receipt', name: '云贝收入', tab: 'c3_1', kind: 'login-read', run: () => yunbeiVipMusicianService.getYunbeiReceipt() },
    { module: 'yunbei_sign', name: '云贝签到（写）', tab: 'c3_1', kind: 'write', buttonText: '签到', note: '写操作：未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用', run: () => yunbeiVipMusicianService.setYunbeiSign() },
    { module: 'yunbei_today', name: '今日云贝', tab: 'c3_1', kind: 'login-read', run: () => yunbeiVipMusicianService.getYunbeiToday() },
    { module: 'yunbei_rcmd_song', name: '推荐歌曲（写）', tab: 'c3_1', kind: 'write', inputKey: 'songId', inputLabel: '歌曲 id', buttonText: '推荐', run: () => yunbeiVipMusicianService.setYunbeiRcmdSong({ id: params.songId, songId: params.songId }) },
    { module: 'yunbei_rcmd_song_history', name: '推荐歌曲历史', tab: 'c3_1', kind: 'login-read', run: () => yunbeiVipMusicianService.getYunbeiRcmdSongHistory() },
    { module: 'yunbei_task_finish', name: '完成任务（写）', tab: 'c3_1', kind: 'write', inputKey: 'taskId', inputLabel: '任务 id', buttonText: '完成任务', run: () => yunbeiVipMusicianService.setYunbeiTaskFinish({ id: params.taskId, userTaskId: params.taskId, taskId: params.taskId }) },
    { module: 'yunbei_tasks', name: '云贝任务（taskId 来源）', tab: 'c3_1', kind: 'login-read', emit: 'taskId', wide: true, run: () => yunbeiVipMusicianService.getYunbeiTasks() },
    { module: 'yunbei_tasks_todo', name: '待办云贝任务（taskId 来源）', tab: 'c3_1', kind: 'login-read', emit: 'taskId', run: () => yunbeiVipMusicianService.getYunbeiTasksTodo() },
    // 3.2 会员成长（7）
    { module: 'vip_info', name: '会员信息', tab: 'c3_2', kind: 'login-read', run: () => yunbeiVipMusicianService.getVipInfo() },
    { module: 'vip_info_v2', name: '会员信息 v2', tab: 'c3_2', kind: 'login-read', run: () => yunbeiVipMusicianService.getVipInfoV2() },
    { module: 'vip_growthpoint', name: '成长值', tab: 'c3_2', kind: 'login-read', run: () => yunbeiVipMusicianService.getVipGrowthpoint() },
    { module: 'vip_growthpoint_get', name: '成长值获取记录', tab: 'c3_2', kind: 'login-read', run: () => yunbeiVipMusicianService.getVipGrowthpointGet() },
    { module: 'vip_growthpoint_details', name: '成长值明细', tab: 'c3_2', kind: 'login-read', run: () => yunbeiVipMusicianService.getVipGrowthpointDetails() },
    { module: 'vip_tasks', name: '会员任务', tab: 'c3_2', kind: 'login-read', run: () => yunbeiVipMusicianService.getVipTasks() },
    { module: 'vip_timemachine', name: '会员时光机', tab: 'c3_2', kind: 'login-read', run: () => yunbeiVipMusicianService.getVipTimemachine() },
    // 3.3 音乐人中心（7）
    { module: 'musician_sign', name: '音乐人签到（写）', tab: 'c3_3', kind: 'write', buttonText: '签到', note: '写操作：未登录降级 + window.confirm 二次确认，禁止 onMounted 自动调用', run: () => yunbeiVipMusicianService.setMusicianSign() },
    { module: 'musician_tasks', name: '音乐人任务', tab: 'c3_3', kind: 'login-read', run: () => yunbeiVipMusicianService.getMusicianTasks() },
    { module: 'musician_tasks_new', name: '音乐人新任务', tab: 'c3_3', kind: 'login-read', run: () => yunbeiVipMusicianService.getMusicianTasksNew() },
    { module: 'musician_cloudbean', name: '音乐人云豆', tab: 'c3_3', kind: 'login-read', run: () => yunbeiVipMusicianService.getMusicianCloudbean() },
    { module: 'musician_cloudbean_obtain', name: '音乐人云豆获取', tab: 'c3_3', kind: 'login-read', run: () => yunbeiVipMusicianService.getMusicianCloudbeanObtain() },
    { module: 'musician_data_overview', name: '音乐人数据概览', tab: 'c3_3', kind: 'login-read', run: () => yunbeiVipMusicianService.getMusicianDataOverview() },
    { module: 'musician_play_trend', name: '音乐人播放趋势', tab: 'c3_3', kind: 'login-read', run: () => yunbeiVipMusicianService.getMusicianPlayTrend() },
  ];

  return useApiConsoleBlocks({ tabs, panelTips, params, blocks, emitHint: '写操作' });
}
