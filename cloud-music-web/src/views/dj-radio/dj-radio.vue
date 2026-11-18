<template>
  <cm-api-console
    v-bind="{
      tabs, hasLogin, activeTab, toast, writeResult, params, results, visibleBlocks, panelTip,
      onFileChange, onParamInput, onItemClick, runBlock, switchTab, clearToast,
      title: '电台 · 分类 · 节目 · 榜单',
      paramsLabel: '参数链路（点选上游列表自动填入，跨 tab 保留，也可手填）',
      paramFields: [
        { key: 'rid', label: 'rid（电台 id → dj_detail / dj_program / dj_sub / dj_subscriber）', placeholder: '← dj_hot / dj_recommend / dj_toplist* 点选' },
        { key: 'cateId', label: 'cateId（分类 id → dj_radio_hot / dj_category_recommend）', placeholder: '← dj_catelist 点选' },
        { key: 'programId', label: 'programId（节目 id → dj_program_detail）', placeholder: '← dj_program 的 programs 点选' },
      ],
    }"
  >
    <template #loginbar>
      当前未登录：<code>dj_sub</code> 订阅写操作与 <code>dj_sublist</code> 订阅列表已降级（不发请求）；其余匿名只读接口可正常加载
    </template>
  </cm-api-console>
</template>

<script setup lang="ts">
import CmApiConsole from '@/components/cm-api-console/cm-api-console.vue';
import { useDjRadio } from './hooks/useDjRadio';

// ref 直出：顶层 ref 在模板 v-bind 中自动解包，无需 reactive 包装
const {
  tabs, hasLogin, activeTab, toast, writeResult, params, results, visibleBlocks, panelTip,
  onFileChange, onParamInput, onItemClick, runBlock, switchTab, clearToast,
} = useDjRadio();
</script>
