<template>
  <!-- 单个接口区块：头信息 / 参数输入 / 请求结果 / 原始返回 -->
  <section class="cm-api-block">
    <header class="cm-api-block--head">
      <span class="cm-api-block--module">{{ block.module }}</span>
      <span class="cm-api-block--title">{{ block.title }}</span>
      <span :class="['cm-api-block--kind', 'kind-' + block.kind]">{{ kindText }}</span>
    </header>
    <p class="cm-api-block--desc">
      {{ block.desc }}<code class="cm-api-block--url">{{ block.url }}</code>
    </p>

    <div class="cm-api-block--controls">
      <input
        v-if="block.input"
        v-model="inputValue"
        class="cm-api-block--input"
        :placeholder="block.input.label"
      />
      <input
        v-if="block.file"
        type="file"
        class="cm-api-block--file"
        @change="onFileChange"
      />
      <button class="cm-api-block--btn" @click="emit('run', block)">{{ buttonText }}</button>
      <span v-if="block.needs" class="cm-api-block--chain">
        {{ block.needs }} ← {{ block.source }}，当前值：<b>{{ sel[block.needs] || '未选择' }}</b>
      </span>
      <span v-if="block.provides && block.provides.length" class="cm-api-block--provides">
        {{ providesText }}
      </span>
    </div>

    <div v-if="state.loading" class="cm-api-block--loading">加载中…</div>
    <p v-if="state.tip" class="cm-api-block--tip">{{ state.tip }}</p>

    <div v-if="state.cards.length" class="cm-api-block--grid">
      <div
        v-for="(card, index) in state.cards"
        :key="block.module + '_' + index"
        class="cm-api-block--card"
        @click="emit('card-click', block, card)"
      >
        <cm-skeleton
          width="100%"
          :height="'110px'"
          :image-url="card.cover || ''"
          :border-radius="'6px'"
        ></cm-skeleton>
        <p class="cm-api-block--card-title" :title="card.title">{{ card.title }}</p>
        <p class="cm-api-block--card-sub">id: {{ card.id }} {{ card.subtitle }}</p>
      </div>
    </div>
    <cm-error
      v-else-if="state.loaded && !state.cards.length"
      :title="'请求完成，无列表数据（详见原始返回）'"
    ></cm-error>

    <details v-if="state.loaded" class="cm-api-block--raw">
      <summary>原始返回（兼容 res.data / res.result / res.xxx）</summary>
      <pre>{{ pretty(state.raw) }}</pre>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { pretty } from './api-block.util';
import { DEFAULT_KIND_LABELS, type ApiBlock, type BlockCard, type BlockState } from './api-block.types';

const props = defineProps<{
  /** 接口区块定义 */
  block: ApiBlock;
  /** 该区块的请求态 */
  state: BlockState;
  /** 全局参数池，透传用于展示当前上游 id */
  sel: Record<string, any>;
  /** 该区块输入框的值 */
  inputValue: string;
  /** 区块类型文案，页面可按业务改写（如账号动作类） */
  kindLabels?: Partial<Record<ApiBlock['kind'], string>>;
}>();

const emit = defineEmits<{
  (e: 'run', block: ApiBlock): void;
  (e: 'card-click', block: ApiBlock, card: BlockCard): void;
  (e: 'file-change', block: ApiBlock, file: File | null): void;
  (e: 'update:inputValue', value: string): void;
}>();

/** 输入框双向绑定：值存父级的 inputs 表 */
const inputValue = computed({
  get: () => props.inputValue,
  set: (value: string) => emit('update:inputValue', value),
});

/** 区块类型标签，页面未覆盖时用默认文案 */
const kindText = computed(
  () => props.kindLabels?.[props.block.kind] ?? DEFAULT_KIND_LABELS[props.block.kind],
);

/** 按钮文案随类型变化：写操作要强调二次确认 */
const buttonText = computed(() => {
  if (props.block.kind === 'write') return '执行（需登录 + 二次确认）';
  if (props.block.kind === 'loginRead') return '加载（需登录）';
  return '请求接口';
});

/** 「点击卡片可提供参数」的提示文案 */
const providesText = computed(() =>
  props.block.file
    ? `返回可提供 ${props.block.provides?.join(' / ')}`
    : `点击列表项可提供 ${props.block.provides?.join(' / ')}`,
);

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('file-change', props.block, target.files?.[0] ?? null);
};
</script>

<style scoped lang="less">
.cm-api-block {
  padding: 16px 20px;
  background: var(--color-default, #fff);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &--head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  &--module {
    padding: 2px 10px;
    border-radius: 4px;
    background: rgba(194, 12, 12, 0.08);
    color: var(--color-primary, #c20c0c);
    font-family: monospace;
    font-size: 12px;
  }

  &--title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  &--kind {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    color: #666;
    background: rgba(0, 0, 0, 0.05);

    &.kind-loginRead {
      color: #b8860b;
      background: rgba(184, 134, 11, 0.12);
    }

    &.kind-write {
      color: #c20c0c;
      background: rgba(194, 12, 12, 0.12);
    }
  }

  &--desc {
    margin-top: 8px;
    font-size: 13px;
    color: #999;
  }

  &--url {
    margin-left: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.04);
    font-family: monospace;
    font-size: 12px;
    color: #666;
  }

  &--controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }

  &--input {
    width: 320px;
    padding: 7px 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    font-size: 13px;
    outline: none;
  }

  &--file {
    font-size: 13px;
  }

  &--btn {
    padding: 7px 18px;
    border: none;
    border-radius: 6px;
    background: var(--color-primary, #c20c0c);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  }

  &--chain,
  &--provides {
    font-size: 12px;
    color: #999;

    b {
      color: var(--color-primary, #c20c0c);
    }
  }

  &--loading,
  &--tip {
    margin-top: 14px;
    font-size: 13px;
    color: #999;
  }

  &--tip {
    color: #6a9955;
  }

  &--grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 18px;
    margin-top: 16px;
  }

  &--card {
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-4px);
    }
  }

  &--card-title {
    margin-top: 8px;
    font-size: 13px;
    color: #333;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--card-sub {
    margin-top: 4px;
    font-size: 11px;
    color: #999;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--raw {
    margin-top: 14px;
    font-size: 12px;

    summary {
      cursor: pointer;
      color: #888;
    }

    pre {
      max-height: 260px;
      overflow: auto;
      padding: 12px;
      margin-top: 8px;
      border-radius: 6px;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}
</style>
