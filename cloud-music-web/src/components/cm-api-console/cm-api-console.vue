<template>
  <div class="cm-api-console">
    <cm-navbar :title="title" :has-load-more="false" />

    <div v-if="!hasLogin" class="cm-api-console--loginbar">
      <slot name="loginbar" />
    </div>
    <div v-if="toast" class="cm-api-console--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="cm-api-console--tabs">
      <cm-button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['cm-api-console--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </cm-button>
    </div>

    <!-- 共享参数链路面板：上游列表点选自动填入，跨 tab 保留，也可手填 -->
    <div class="cm-api-console--params">
      <span class="cm-api-console--params-label">{{ paramsLabel }}</span>
      <label v-for="field in paramFields" :key="field.key" class="cm-api-console--params-item">
        {{ field.label }}
        <cm-input :value="params[field.key]" :placeholder="field.placeholder" @input="onParamInput(field.key, $event)" />
      </label>
    </div>

    <div class="cm-api-console--panel">
      <p class="cm-api-console--panel-tip">{{ panelTip }}</p>
      <div class="cm-api-console--grid grid-cols-2">
        <!-- 每个接口一个可交互区块，标题标注 module 名 -->
        <section
          v-for="b in visibleBlocks"
          :key="b.module"
          class="cm-api-console--block"
          :class="{ 'cm-api-console--block--wide': b.wide }"
        >
          <h3 class="cm-api-console--block-title">
            <code class="cm-api-console--module">{{ b.module }}</code> {{ b.name }}
            <span v-if="b.kind === 'invalid'" class="cm-api-console--badge cm-api-console--badge--invalid">已登记失效</span>
            <span v-else-if="b.kind === 'pending'" class="cm-api-console--badge cm-api-console--badge--pending">待核·不进主路径</span>
            <span v-else-if="b.kind === 'write' || b.kind === 'upload'" class="cm-api-console--badge cm-api-console--badge--write">写操作</span>
            <span v-else-if="b.kind === 'login-read'" class="cm-api-console--badge cm-api-console--badge--login">需登录只读</span>
          </h3>
          <p v-if="b.note" class="cm-api-console--note">{{ b.note }}</p>
          <p v-if="(b.kind === 'login-read' || b.kind === 'write' || b.kind === 'upload') && !hasLogin" class="cm-api-console--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div class="cm-api-console--block-actions">
            <label v-if="b.inputKey" class="cm-api-console--inline-label">
              {{ b.inputLabel || b.inputKey }}
              <cm-input
                :value="params[b.inputKey || '']"
                :placeholder="b.inputHint || '点选上游列表自动填入，或手填'"
                @input="onParamInput(b.inputKey, $event)"
              />
            </label>
            <label v-if="b.kind === 'upload'" class="cm-api-console--inline-label">
              选择文件<cm-input type="file" :accept="uploadAccept" @change="onFileChange" />
            </label>
            <cm-button
              class="cm-api-console--btn"
              :class="{ 'cm-api-console--btn--write': b.kind === 'write' || b.kind === 'upload' }"
              @click="runBlock(b)"
            >
              {{ b.buttonText || '加载' }}
            </cm-button>
            <span class="cm-api-console--count">{{ results[b.module]?.length || 0 }} 条</span>
            <span v-if="b.emit" class="cm-api-console--emit">点选列表项 → 填入 {{ b.emit }}</span>
          </div>
          <div v-if="results[b.module] && results[b.module].length" class="cm-api-console--list">
            <div
              v-for="(item, idx) in results[b.module]"
              :key="b.module + '_' + idx"
              class="cm-api-console--item"
              :class="{ 'cm-api-console--item--clickable': !!b.emit }"
              @click="onItemClick(b, item)"
            >
              <span class="cm-api-console--item-title">{{ item.title }}</span>
              <span class="cm-api-console--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="cm-api-console--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="cm-api-console--empty">暂无数据或接口返回为空</p>
        </section>
      </div>
      <div v-if="writeResult" class="cm-api-console--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiConsoleTab, Block, CardItem } from '@/composables/useApiConsoleBlocks';

/** 参数链路面板的单个输入字段：标签、占位符与写回 hook 参数的 key */
export interface ApiConsoleParamField {
  key: string;
  label: string;
  placeholder: string;
}

defineOptions({ name: 'CmApiConsole', inheritAttrs: false });

defineProps<{
  title: string;
  tabs: ApiConsoleTab[];
  hasLogin: boolean;
  activeTab: string;
  toast: string;
  writeResult: string;
  params: Record<string, string>;
  results: Record<string, CardItem[]>;
  visibleBlocks: Block[];
  panelTip: string;
  paramsLabel: string;
  paramFields: ApiConsoleParamField[];
  uploadAccept?: string;
  onFileChange: (e: Event) => void;
  onParamInput: (key: string | undefined, e: Event) => void;
  onItemClick: (b: Block, item: CardItem) => void;
  runBlock: (b: Block) => void | Promise<void>;
  switchTab: (code: string) => void;
  clearToast: () => void;
}>();
</script>

<style scoped lang="less">
.cm-api-console {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

  // 登录降级文案由页面通过 loginbar slot 注入，需穿透 scoped 命中其中的 code 标签
  :deep(code) {
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
    line-height: 1.7;
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

  &--params {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-top: 18px;
    padding: 14px 18px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--params-label {
    color: var(--color-text-secondary);
    font-size: 13px;
  }

  &--params-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-secondary);
    font-size: 13px;

    input {
      width: 210px;
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

  &--badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 400;
    vertical-align: middle;
  }

  &--badge--invalid,
  &--badge--write {
    background: #fff1f0;
    color: #cf1322;
  }

  &--badge--pending {
    background: #fff7e6;
    color: #d48806;
  }

  &--badge--login {
    background: #f0f5ff;
    color: #2f54eb;
  }

  &--note {
    margin-top: 8px;
    color: var(--color-text-secondary);
    font-size: 12px;
    line-height: 1.6;
  }

  &--degrade {
    margin-top: 8px;
    color: #d48806;
    font-size: 12px;
  }

  &--block-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 12px 0;
  }

  &--inline-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-secondary);
    font-size: 13px;

    input {
      width: 190px;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary);
      }
    }

    input[type='file'] {
      width: 200px;
      padding: 4px 0;
      border: none;
    }
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

  &--count,
  &--emit {
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  &--emit {
    color: #2f54eb;
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
  }

  &--item--clickable {
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
