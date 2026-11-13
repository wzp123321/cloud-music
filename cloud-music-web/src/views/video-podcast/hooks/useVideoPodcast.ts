import { reactive, ref } from 'vue';

import videoPodcastService from '@/apis/video-podcast/video-podcast.service';
import { Block, useApiConsoleBlocks } from '@/composables/useApiConsoleBlocks';

/**
 * 视频 · 播客 · 信息流 · 上传（P1 2.1~2.3）调试台。
 * 数据与交互编排统一交给 useApiConsoleBlocks，本 hook 只声明本页专属配置。
 */
export const useVideoPodcast = () => {
  /** 2.1~2.3 按 capability 子任务分 tab */
  const tabs = [
    { code: 'c2_1', name: '2.1 视频发现（5）' },
    { code: 'c2_2', name: '2.2 视频播放与订阅（4）' },
    { code: 'c2_3', name: '2.3 播客（5）' },
  ];

  const panelTips: Record<string, string> = {
    c2_1: '5 个视频发现接口，每接口一个可交互区块，标题标注 module 名；video_group_list / video_timeline_all 列表点选提供 videoId；video_timeline_* 需登录，未登录降级。',
    c2_2: 'video_detail 待核（需有效视频 id），手动按钮 + 输入框，不进主路径；video_detail_info(vid) / video_url(id) / video_sub(写) 的 videoId ← 上游视频列表点选，列表点击带参再请求详情。',
    c2_3: 'voicelist_* / voice_detail 需登录只读降级；voicelist_list 列表点选提供 voiceId ← voicelist_search / voice_detail；voice_upload 为上传写操作（postFormRequest + 二次确认）。',
  };

  const params = reactive<Record<string, string>>({
    videoId: '',
    voiceId: '',
    groupId: '',
    voiceKeyword: '',
    voiceName: '',
  });

  const uploadFile = ref<File | null>(null);

  /** 14 个接口一一对应 14 个区块，每个 run 即该接口在页面的真实调用点 */
  const blocks: Block[] = [
    // 2.1 视频发现（5）
    { module: 'video_category_list', name: '视频分类', tab: 'c2_1', kind: 'read', auto: true, run: () => videoPodcastService.getVideoCategoryList() },
    { module: 'video_group', name: '视频分组', tab: 'c2_1', kind: 'read', inputKey: 'groupId', inputLabel: '分组 id', run: () => videoPodcastService.getVideoGroup({ id: Number(params.groupId) || undefined, groupId: params.groupId || undefined }) },
    { module: 'video_group_list', name: '视频分组列表（videoId 来源）', tab: 'c2_1', kind: 'read', emit: 'videoId', auto: true, wide: true, run: () => videoPodcastService.getVideoGroupList() },
    { module: 'video_timeline_all', name: '全部视频信息流（需登录）', tab: 'c2_1', kind: 'login-read', emit: 'videoId', run: () => videoPodcastService.getVideoTimelineAll() },
    { module: 'video_timeline_recommend', name: '推荐视频信息流（需登录）', tab: 'c2_1', kind: 'login-read', run: () => videoPodcastService.getVideoTimelineRecommend() },
    // 2.2 视频播放与订阅（4）
    { module: 'video_detail', name: '视频详情', tab: 'c2_2', kind: 'pending', inputKey: 'videoId', inputLabel: '视频 id', buttonText: '手动查看', note: '待核：需有效视频 id（非分组 id），不进主路径，仅手动按钮 + 输入框触发', run: () => videoPodcastService.getVideoDetail({ id: params.videoId }) },
    { module: 'video_detail_info', name: '视频详情信息', tab: 'c2_2', kind: 'read', inputKey: 'videoId', inputLabel: 'vid', run: () => videoPodcastService.getVideoDetailInfo({ vid: params.videoId, id: params.videoId }) },
    { module: 'video_url', name: '视频播放地址', tab: 'c2_2', kind: 'read', inputKey: 'videoId', inputLabel: 'id', run: () => videoPodcastService.getVideoUrl({ id: params.videoId, vid: params.videoId }) },
    { module: 'video_sub', name: '订阅视频（写）', tab: 'c2_2', kind: 'write', inputKey: 'videoId', inputLabel: 'id', buttonText: '订阅(t=1)', run: () => videoPodcastService.setVideoSub({ id: params.videoId, vid: params.videoId, t: 1 }) },
    // 2.3 播客（5）
    { module: 'voicelist_list', name: '播客列表（voiceId 来源，需登录）', tab: 'c2_3', kind: 'login-read', emit: 'voiceId', wide: true, run: () => videoPodcastService.getVoicelistList({ limit: 30 }) },
    { module: 'voicelist_list_search', name: '播客列表搜索（需登录）', tab: 'c2_3', kind: 'login-read', inputKey: 'voiceKeyword', inputLabel: '关键词 keywords', run: () => videoPodcastService.getVoicelistListSearch({ keywords: params.voiceKeyword, keyword: params.voiceKeyword }) },
    { module: 'voicelist_search', name: '播客搜索（需登录）', tab: 'c2_3', kind: 'login-read', inputKey: 'voiceId', inputLabel: 'id（← voicelist_list）', run: () => videoPodcastService.getVoicelistSearch({ id: params.voiceId, voiceListId: params.voiceId, keywords: params.voiceKeyword }) },
    { module: 'voice_detail', name: '播客详情（需登录）', tab: 'c2_3', kind: 'login-read', inputKey: 'voiceId', inputLabel: 'id', run: () => videoPodcastService.getVoiceDetail({ id: params.voiceId, voiceId: params.voiceId }) },
    {
      module: 'voice_upload',
      name: '上传声音（写 / 上传）',
      tab: 'c2_3',
      kind: 'upload',
      inputKey: 'voiceName',
      inputLabel: '声音名称 name',
      buttonText: '上传',
      note: '写操作：未登录降级 + window.confirm 二次确认；postFormRequest multipart 上传，禁止 onMounted 自动调用',
      run: () => {
        const formData = new FormData();
        if (uploadFile.value) formData.append('songFile', uploadFile.value);
        formData.append('name', params.voiceName || '未命名声音');
        return videoPodcastService.uploadVoice(formData);
      },
    },
  ];

  return useApiConsoleBlocks({ tabs, panelTips, params, uploadFile, blocks });
}
