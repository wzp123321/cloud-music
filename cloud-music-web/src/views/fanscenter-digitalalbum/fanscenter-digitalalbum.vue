<template>
  <ApiConsolePage title="粉丝中心与数字专辑" :blocks="blocks" :tabs="tabs"
  >
    <template #intro>
      共 9 个接口（任务 5.1 粉丝中心 5 个、5.2 数字专辑 4 个），按 capability 分组切换，每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>。粉丝中心接口全部需登录只读，未登录降级不发请求；
      数字专辑 <code>detail/sales</code> 需有效 id，属「待核不进主路径」，仅手动输入 id 点击后触发；<code>ordering</code> 为写操作需登录 + <code>window.confirm</code> 二次确认，绝不在 onMounted 自动触发。
      参数链路：<code>detail/sales</code> 的 id ← <code>digitalAlbum_purchased</code> 返回或输入框。
    
    </template>
    <template #foot>
      说明：写操作按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求；需登录只读接口未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。列表项点击可把上游 id 写入参数池，供下游详情接口带参。
    
    </template>
  </ApiConsolePage>
</template>

<script setup lang="ts">
import ApiConsolePage from '@/components/api-console-page/api-console-page.vue';
import { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { blocks, tabs } from './fanscenter-digitalalbum.blocks';

const loggedIn = hasLogin();
</script>
