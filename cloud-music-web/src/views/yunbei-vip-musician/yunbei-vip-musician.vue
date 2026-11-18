<template>
  <cm-api-console
    v-bind="{
      tabs, hasLogin, activeTab, toast, writeResult, params, results, visibleBlocks, panelTip,
      onFileChange, onParamInput, onItemClick, runBlock, switchTab, clearToast,
      title: '云贝 · 会员成长 · 音乐人中心',
      paramsLabel: '参数链路（点选任务列表自动填入，也可手填）',
      paramFields: [
        { key: 'taskId', label: 'taskId（任务 id → yunbei_task_finish）', placeholder: '← yunbei_tasks / yunbei_tasks_todo 点选' },
        { key: 'songId', label: 'songId（歌曲 id → yunbei_rcmd_song）', placeholder: '手填歌曲 id' },
      ],
    }"
  >
    <template #loginbar>
      当前未登录：本页 <code>yunbei*</code> / <code>vip_*</code> / <code>musician_*</code> 需登录只读接口与 4 个写操作均已降级（不发请求）；
      <code>yunbei_info</code> 已登记失效（上游 404）
    </template>
  </cm-api-console>
</template>

<script setup lang="ts">
import CmApiConsole from '@/components/cm-api-console/cm-api-console.vue';
import { useYunbeiVipMusician } from './hooks/useYunbeiVipMusician';

// ref 直出：顶层 ref 在模板 v-bind 中自动解包，无需 reactive 包装
const {
  tabs, hasLogin, activeTab, toast, writeResult, params, results, visibleBlocks, panelTip,
  onFileChange, onParamInput, onItemClick, runBlock, switchTab, clearToast,
} = useYunbeiVipMusician();
</script>
