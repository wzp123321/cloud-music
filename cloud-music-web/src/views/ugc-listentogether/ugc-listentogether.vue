<template>
  <api-console-page title="UGC 与一起听" :blocks="blocks" :tabs="tabs"
  >
    <template #intro>
      共 15 个接口（任务 4.1 UGC 内容 7 个、4.2 一起听房间 8 个），按 capability
      分组切换，每个区块标注 module 名并对应一个真实接口调用点。 当前登录状态：<b>{{
        loggedIn ? '已登录' : '未登录'
      }}</b
      >。读取型接口可匿名请求；需登录只读接口未登录降级不发请求； 写操作需登录 +
      <code>window.confirm</code> 二次确认，且绝不在 <code>onMounted</code> 自动触发。
      参数链路：<code>ugc_*_get</code> 的 id ← <code>ugc_artist_search</code> 搜索结果；<code
        >room_check/status/sync_playlist_get</code
      >
      的 roomId ← <code>room_create</code> 返回或输入框。
    
    </template>
    <template #foot>
      说明：写操作按钮会先判断是否登录，再弹出 window.confirm
      二次确认，确认后才发请求；需登录只读接口未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。列表项点击可把上游 id 写入参数池，供下游详情接口带参。
    
    </template>
  </api-console-page>
</template>

<script setup lang="ts">
import ApiConsolePage from '@/components/api-console-page/api-console-page.vue';
import { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { blocks, tabs } from './ugc-listentogether.blocks';

const loggedIn = hasLogin();
</script>
