<template>
  <cm-api-console
    v-bind="{
      tabs, hasLogin, activeTab, toast, writeResult, params, results, visibleBlocks, panelTip,
      onFileChange, onParamInput, onItemClick, runBlock, switchTab, clearToast,
      title: '视频 · 播客 · 信息流 · 上传',
      paramsLabel: '参数链路（点选上游列表自动填入，跨 tab 保留，也可手填）',
      paramFields: [
        { key: 'videoId', label: 'videoId（视频 id/vid → video_detail / video_detail_info / video_url / video_sub）', placeholder: '← video_group_list / video_timeline_all 点选' },
        { key: 'voiceId', label: 'voiceId（播客 id → voicelist_search / voice_detail）', placeholder: '← voicelist_list 点选' },
        { key: 'voiceKeyword', label: 'voiceKeyword（关键词 → voicelist_list_search / voicelist_search）', placeholder: '输入播客关键词' },
      ],
      uploadAccept: 'audio/*',
    }"
  >
    <template #loginbar>
      当前未登录：<code>video_timeline_*</code>、<code>voicelist_*</code>、<code>voice_detail</code> 等需登录只读接口已降级（不发请求）；
      <code>video_sub</code> / <code>voice_upload</code> 写操作不可用
    </template>
  </cm-api-console>
</template>

<script setup lang="ts">
import CmApiConsole from '@/components/cm-api-console/cm-api-console.vue';
import { useVideoPodcast } from './hooks/useVideoPodcast';

// ref 直出：顶层 ref 在模板 v-bind 中自动解包，无需 reactive 包装
const {
  tabs, hasLogin, activeTab, toast, writeResult, params, results, visibleBlocks, panelTip,
  onFileChange, onParamInput, onItemClick, runBlock, switchTab, clearToast,
} = useVideoPodcast();
</script>
