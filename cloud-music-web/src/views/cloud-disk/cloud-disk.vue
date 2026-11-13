<template>
  <api-console-page title="云盘" :blocks="blocks" :tabs="tabs"
  >
    <template #intro>
      共 2 个接口（任务 6.1），每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>。<code>cloud</code> 为上传写操作，使用
      <code>postFormRequest + FormData</code>（选择本地音频 + songId），需登录 + <code>window.confirm</code> 二次确认，绝不在 onMounted 自动触发；
      <code>cloud_match</code> 需登录只读，未登录降级不发请求。参数链路：<code>cloud</code> 的 songId ← <code>cloud_match</code> 返回或输入框。
    
    </template>
    <template #foot>
      说明：写操作按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求；需登录只读接口未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。上传需先选择本地音频文件，再把 songId 与文件一起放进 FormData 提交。
    
    </template>
  </api-console-page>
</template>

<script setup lang="ts">
import ApiConsolePage from '@/components/api-console-page/api-console-page.vue';
import { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { blocks, tabs } from './cloud-disk.blocks';

const loggedIn = hasLogin();
</script>
