<template>
  <div :class="rootClass">
    <cm-navbar :title="title" :has-load-more="false"></cm-navbar>

    <p :class="rootClass + '--intro'">
      <slot name="intro"></slot>
    </p>

    <div :class="rootClass + '--globals'">
      <slot name="globals" :sel="sel" :sel-keys="selKeys">
        <label v-for="key in selKeys" :key="key" class="pg--global">
          <span>参数池 {{ key }}（来自上游列表点击项 / 手动输入）</span>
          <cm-input v-model="sel[key]" type="text" :placeholder="key + '：可手动填写'" />
        </label>
      </slot>
    </div>

    <div :class="rootClass + '--tabs'">
      <cm-button
        v-for="tab in tabs"
        :key="tab.code"
        :class="[rootClass + '--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </cm-button>
    </div>

    <div :class="rootClass + '--blocks'">
      <cm-api-block
        v-for="block in activeBlocks"
        :key="block.module"
        :block="block"
        :state="states[block.module]"
        :sel="sel"
        :input-value="inputs[block.module] ?? ''"
        :kind-labels="kindLabels"
        @update:input-value="inputs[block.module] = $event"
        @run="runBlock"
        @card-click="onCardClick"
        @file-change="onFileChange"
      ></cm-api-block>
    </div>

    <p :class="rootClass + '--foot'">
      <slot name="foot"></slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useApiConsole } from '@/components/cm-api-block/use-api-console';
import type { ApiBlock } from '@/components/cm-api-block/api-block.types';

const props = withDefaults(
  defineProps<{
    title: string;
    blocks: ApiBlock[];
    tabs: { code: string; name: string }[];
    /** 样式前缀：默认 pg；带专属样式的页面传自身前缀 */
    rootClass?: string;
    kindLabels?: Partial<Record<ApiBlock['kind'], string>>;
  }>(),
  { rootClass: 'pg' },
);

const { activeTab, activeBlocks, sel, selKeys, inputs, states, runBlock, onCardClick, onFileChange, switchTab } =
  useApiConsole(props.blocks);
</script>
