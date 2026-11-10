<template>
  <div class="pg">
    <cm-navbar :title="'云盘'" :has-load-more="false"></cm-navbar>

    <p class="pg--intro">
      共 2 个接口（任务 6.1），每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>。<code>cloud</code> 为上传写操作，使用
      <code>postFormRequest + FormData</code>（选择本地音频 + songId），需登录 + <code>window.confirm</code> 二次确认，绝不在 onMounted 自动触发；
      <code>cloud_match</code> 需登录只读，未登录降级不发请求。参数链路：<code>cloud</code> 的 songId ← <code>cloud_match</code> 返回或输入框。
    </p>

    <div class="pg--globals">
      <label v-for="key in selKeys" :key="key" class="pg--global">
        <span>参数池 {{ key }}（来自上游列表点击项 / 手动输入）</span>
        <input v-model="sel[key]" type="text" :placeholder="key + '：可手动填写'" />
      </label>
    </div>

    <div class="pg--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['pg--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="pg--blocks">
      <cm-api-block
        v-for="block in activeBlocks"
        :key="block.module"
        :block="block"
        :state="states[block.module]"
        :sel="sel"
        :input-value="inputs[block.module] ?? ''"
        @update:input-value="inputs[block.module] = $event"
        @run="runBlock"
        @card-click="onCardClick"
        @file-change="onFileChange"
      ></cm-api-block>
    </div>

    <p class="pg--foot">
      说明：写操作按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求；需登录只读接口未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。上传需先选择本地音频文件，再把 songId 与文件一起放进 FormData 提交。
    </p>
  </div>
</template>

<script setup lang="ts">
import { useApiConsole } from '@/components/cm-api-block/use-api-console';

import { blocks, tabs } from './cloud-disk.blocks';

// 区块渲染交给 cm-api-block，请求编排交给 useApiConsole，本页只剩骨架
const {
  loggedIn,
  activeTab,
  activeBlocks,
  sel,
  selKeys,
  inputs,
  states,
  runBlock,
  onCardClick,
  onFileChange,
  switchTab,
} = useApiConsole(blocks);
</script>
