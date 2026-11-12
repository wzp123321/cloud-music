<template>
  <ApiConsolePage title="杂项长尾" :blocks="blocks" :tabs="tabs"
  >
    <template #intro>
      共 9 个接口（任务 8.1），每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>。<code>inner_version</code> 为只读，应用启动即 onMounted 自动加载自检；
      <code>weblog</code> 为写操作，需登录 + <code>window.confirm</code> 二次确认，禁止 onMounted 自动调用；
      <code>calendar</code> 需登录只读、未登录降级，时间参数用 <code>new Date()</code> 生成（不硬编码）；
      <code>pl_count</code> 业务异常属「待核不进主路径」，仅手动点击触发、不自动加载。
    
    </template>
    <template #foot>
      说明：写操作（weblog）按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求；需登录只读接口（calendar）未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。inner_version 在 onMounted 自动加载用于版本自检。
    
    </template>
  </ApiConsolePage>
</template>

<script setup lang="ts">
import ApiConsolePage from '@/components/api-console-page/api-console-page.vue';
import { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { blocks, tabs } from './misc-longtail.blocks';

const loggedIn = hasLogin();
</script>
