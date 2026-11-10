<template>
  <div class="pg">
    <cm-navbar :title="'杂项长尾'" :has-load-more="false"></cm-navbar>

    <p class="pg--intro">
      共 9 个接口（任务 8.1），每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>。<code>inner_version</code> 为只读，应用启动即 onMounted 自动加载自检；
      <code>weblog</code> 为写操作，需登录 + <code>window.confirm</code> 二次确认，禁止 onMounted 自动调用；
      <code>calendar</code> 需登录只读、未登录降级，时间参数用 <code>new Date()</code> 生成（不硬编码）；
      <code>pl_count</code> 业务异常属「待核不进主路径」，仅手动点击触发、不自动加载。
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
      ></cm-api-block>
    </div>

    <p class="pg--foot">
      说明：写操作（weblog）按钮会先判断是否登录，再弹出 window.confirm 二次确认，确认后才发请求；需登录只读接口（calendar）未登录时仅提示、不发请求；
      每个请求独立 try/catch，失败降级为空值。inner_version 在 onMounted 自动加载用于版本自检。
    </p>
  </div>
</template>

<script setup lang="ts">
import { useApiConsole } from '@/components/cm-api-block/use-api-console';

import { blocks, tabs } from './misc-longtail.blocks';

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
  switchTab,
} = useApiConsole(blocks);
</script>
