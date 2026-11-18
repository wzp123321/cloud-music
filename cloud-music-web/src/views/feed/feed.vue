<template>
  <div class="feed">
    <cm-navbar :title="'动态流 · 话题 · 相关推荐'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="feed--loginbar">
      当前未登录：<code>event</code> / <code>topic_sublist</code> 已降级，<code>event_del</code> / <code>event_forward</code> 写操作不可用
    </div>
    <div v-if="toast" class="feed--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="feed--tabs">
      <cm-button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['feed--tab', activeTab === tab.code ? 'active' : '']"
        @click="setActiveTab(tab.code)"
      >
        {{ tab.name }}
      </cm-button>
    </div>

    <div class="feed--panel">
      <p v-if="activeTab === 'c5_1'" class="feed--panel-tip">
        <code>event</code> 列表项可点选，动态 id 自动填入 <code>event_del</code> / <code>event_forward</code>。
      </p>
      <p v-else-if="activeTab === 'c5_2'" class="feed--panel-tip">
        <code>hot_topic</code> 在本页有独立调用点（与 P1 2.4 重复但不共用）；列表项可点选，
        actid 自动填入 <code>topic_detail</code> / <code>topic_detail_event_hot</code>。
      </p>
      <p v-else class="feed--panel-tip">相关推荐的 id 来自页面输入（或上游列表项），点击按钮后请求对应接口。</p>

      <div class="feed--grid grid-cols-2">
        <section
          v-for="block in visibleBlocks"
          :key="block.module"
          class="feed--block"
          :class="{ 'feed--block--wide': block.wide }"
        >
          <h3 class="feed--block-title">
            <code class="feed--module">{{ block.module }}</code> {{ block.name }}
          </h3>
          <p v-if="block.kind === 'login-read' && !hasLogin" class="feed--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div v-if="block.inputs" class="feed--form">
            <label v-for="input in block.inputs" :key="input.label">
              {{ input.label }}
              <cm-input
                :value="input.get()"
                :placeholder="input.placeholder"
                @input="onBlockInput(input, $event)"
              />
            </label>
          </div>
          <div class="feed--block-actions">
            <cm-button
              class="feed--btn"
              :class="{ 'feed--btn--write': block.kind === 'write' }"
              @click="block.run"
            >
              {{ block.buttonText }}
            </cm-button>
            <span v-if="block.list?.showCount" class="feed--count">{{ block.list.getItems().length }} 条</span>
          </div>
          <template v-if="block.list">
            <div v-if="block.list.getItems().length" class="feed--list">
              <div
                v-for="(item, idx) in block.list.getItems()"
                :key="block.module + '_' + idx"
                class="feed--item"
                @click="block.list.onItemClick && block.list.onItemClick(item)"
              >
                <span class="feed--item-title">{{ item.title }}</span>
                <span class="feed--item-sub">{{ item.subtitle }}</span>
                <span v-if="item.id && block.list.showId" class="feed--item-id">#{{ item.id }}</span>
              </div>
            </div>
            <p v-else class="feed--empty">{{ block.list.emptyText }}</p>
          </template>
        </section>
      </div>

      <div v-if="writeResult && activeTab === 'c5_1'" class="feed--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFeed } from './hooks/useFeed';

const { tabs, hasLogin, activeTab, toast, writeResult, visibleBlocks, setActiveTab, clearToast, onBlockInput } =
  useFeed();
</script>

<style scoped lang="less">
.feed {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

  code {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(194, 12, 12, 0.08);
    color: var(--color-primary);
    font-size: 12px;
  }

  &--loginbar {
    margin-top: 18px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #fff7e6;
    color: #ad6800;
    font-size: 13px;
  }

  &--toast {
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: 6px;
    background: #f0f7ff;
    color: #31708f;
    font-size: 13px;
    cursor: pointer;
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
    color: var(--color-text-secondary);
    font-size: 14px;
    cursor: pointer;

    &.active {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: rgba(194, 12, 12, 0.06);
    }
  }

  &--panel {
    margin-top: 22px;
  }

  &--panel-tip {
    margin-bottom: 16px;
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }

  &--grid {
    display: grid;
    gap: 20px;
  }

  &--block {
    padding: 16px 20px;
    border-radius: 8px;
    background: var(--color-default, #fff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  &--block--wide {
    grid-column: 1 / -1;
  }

  &--block-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &--module {
    margin-right: 6px;
  }

  &--degrade {
    margin-top: 8px;
    color: #d48806;
    font-size: 12px;
  }

  &--block-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
  }

  &--count {
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  &--btn {
    padding: 7px 16px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    background: var(--color-default, #fff);
    color: #444;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }

  &--btn--write {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &--form {
    margin-top: 12px;

    label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      color: var(--color-text-secondary);
      font-size: 13px;
      white-space: nowrap;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary);
      }
    }
  }

  &--list {
    margin-top: 10px;
    max-height: 240px;
    overflow-y: auto;
  }

  &--item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 6px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;

    &:hover {
      background: #fafafa;
    }
  }

  &--item-title {
    flex: 1;
    color: var(--color-text-primary);
    font-size: 13px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--item-sub,
  &--item-id {
    color: #aaa;
    font-size: 12px;
    white-space: nowrap;
  }

  &--empty {
    margin-top: 10px;
    color: #bbb;
    font-size: 12px;
  }

  &--result {
    margin-top: 20px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #f6ffed;
    color: #389e0d;
    font-size: 13px;
  }
}
</style>
