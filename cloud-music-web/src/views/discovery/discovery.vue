<template>
  <div class="discovery">
    <cm-navbar :title="'个性化发现与风格分类'" :has-load-more="false"></cm-navbar>

    <p class="discovery--intro">
      共 21 个接口（任务 2.1~2.4），按 capability 分组切换，每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>（未登录时写操作与需登录只读接口会降级提示，不发请求）。
    </p>

    <!-- 详情型接口的参数来源：来自上游列表点击项，或页面手动输入 -->
    <div class="discovery--globals">
      <label class="discovery--global">
        <span>tagId（← style_list）</span>
        <input v-model.number="sel.tagId" type="number" placeholder="来自 style_list 点击项 / 手动输入" />
      </label>
      <label class="discovery--global">
        <span>sheetId（← sheet_list）</span>
        <input v-model.number="sel.sheetId" type="number" placeholder="来自 sheet_list 点击项 / 手动输入" />
      </label>
      <label class="discovery--global">
        <span>mlogId（← mlog_music_rcmd）</span>
        <input v-model.number="sel.mlogId" type="number" placeholder="来自 mlog 列表点击项 / 手动输入" />
      </label>
    </div>

    <div class="discovery--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['discovery--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="discovery--blocks">
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

    <p class="discovery--foot">
      说明：列表接口点击卡片会把 id 写入上方全局参数，再点击详情型接口按钮即「列表点击带参再请求详情」。
    </p>
  </div>
</template>

<script setup lang="ts">
import { useApiConsole } from '@/components/cm-api-block/use-api-console';

import { blocks, tabs } from './discovery.blocks';

// 区块渲染交给 cm-api-block，请求编排交给 useApiConsole，本页只剩骨架
const { loggedIn, activeTab, activeBlocks, sel, inputs, states, runBlock, onCardClick, switchTab } =
  useApiConsole(blocks);
</script>

<style scoped lang="less">
.discovery {
  width: 1400px;
  margin: 0 auto;
  padding: 24px 0 48px;

  &--intro {
    margin-top: 20px;
    font-size: 13px;
    line-height: 1.8;
    color: #888;

    b {
      color: var(--color-primary, #c20c0c);
    }
  }

  &--globals {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
    padding: 14px 18px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--global {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;

    input {
      width: 240px;
      padding: 6px 10px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      font-size: 13px;
      outline: none;
    }
  }

  &--tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  &--tab {
    padding: 8px 18px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 18px;
    background: var(--color-default, #fff);
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &.active {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
      background: rgba(194, 12, 12, 0.06);
    }
  }

  &--blocks {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 24px;
  }

  &--foot {
    margin-top: 32px;
    font-size: 12px;
    color: #aaa;
  }
}

</style>
