<template>
  <api-console-page title="个性化发现与风格分类" :blocks="blocks" :tabs="tabs"
    root-class="discovery"
  >
    <template #intro>
      共 21 个接口（任务 2.1~2.4），按 capability 分组切换，每个区块标注 module 名并对应一个真实接口调用点。
      当前登录状态：<b>{{ loggedIn ? '已登录' : '未登录' }}</b>（未登录时写操作与需登录只读接口会降级提示，不发请求）。
    
    </template>
    <template #globals="{ sel }">
      <label class="discovery--global">
        <span>tagId（← style_list）</span>
        <cm-input v-model.number="sel.tagId" type="number" placeholder="来自 style_list 点击项 / 手动输入" />
      </label>
      <label class="discovery--global">
        <span>sheetId（← sheet_list）</span>
        <cm-input v-model.number="sel.sheetId" type="number" placeholder="来自 sheet_list 点击项 / 手动输入" />
      </label>
      <label class="discovery--global">
        <span>mlogId（← mlog_music_rcmd）</span>
        <cm-input v-model.number="sel.mlogId" type="number" placeholder="来自 mlog 列表点击项 / 手动输入" />
      </label>
    </template>
    <template #foot>
      说明：列表接口点击卡片会把 id 写入上方全局参数，再点击详情型接口按钮即「列表点击带参再请求详情」。
    
    </template>
  </api-console-page>
</template>

<script setup lang="ts">
import ApiConsolePage from '@/components/api-console-page/api-console-page.vue';
import { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { blocks, tabs } from './discovery.blocks';

const loggedIn = hasLogin();
</script>

<style lang="less">
.discovery {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

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
