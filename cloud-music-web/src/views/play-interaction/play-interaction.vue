<template>
  <ApiConsolePage title="歌曲互动与播放记录" :blocks="blocks" :tabs="tabs"
    root-class="pi"
  >
    <template #intro>
      共 23 个接口（任务 3.1~3.5），按 capability 分组切换，每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>（写操作需登录 +
      二次确认；需登录只读接口未登录降级不发请求）。 特殊路由：<code>personal_fm → /personal_fm</code>、<code>fm_trash → /fm_trash</code>。
    
    </template>
    <template #globals="{ sel }">
      <label class="pi--global">
        <span>当前歌曲 ID（song_* / check_music / lyric_new 等的 id 来源）</span>
        <cm-input
          v-model.number="sel.songId"
          type="number"
          placeholder="来自歌曲列表点击项 / 手动输入"
        />
      </label>
      <label class="pi--global">
        <span>历史推荐 id（← history_recommend_songs）</span>
        <cm-input
          v-model.number="sel.historyId"
          type="number"
          placeholder="来自 history_recommend_songs 点击项 / 手动输入"
        />
      </label>
      <label class="pi--global">
        <span>歌单 pid（可选，用于智能播放 / scrobble）</span>
        <cm-input v-model.number="sel.pid" type="number" placeholder="可选" />
      </label>
    </template>
    <template #foot>
      说明：写操作按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求，且绝不在
      onMounted 自动触发； 需登录只读接口未登录时仅提示、不发请求。
    
    </template>
  </ApiConsolePage>
</template>

<script setup lang="ts">
import ApiConsolePage from '@/components/api-console-page/api-console-page.vue';
import { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { blocks, tabs } from './play-interaction.blocks';

const loggedIn = hasLogin();
</script>
