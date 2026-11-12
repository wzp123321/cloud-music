<template>
  <input :value="modelValue" @input="onInput" />
</template>

<script setup lang="ts">
/**
 * 输入框原子组件。
 *
 * 内部仍是原生 input：src/assets/style/input.css 以 input / input[error] 选择器统一样式。
 * 未声明的 attrs（placeholder、type、min、accept、class、@change ...）自动透传到根元素；
 * v-model 及其 .number / .trim 修饰符由 modelModifiers 复刻 Vue 原生行为。
 */
const props = defineProps<{
  modelValue?: string | number;
  modelModifiers?: { number?: boolean; trim?: boolean };
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>();

defineOptions({ name: 'CmInput', inheritAttrs: true });

const onInput = (event: Event) => {
  let value: string | number = (event.target as HTMLInputElement).value;
  if (props.modelModifiers?.trim) {
    value = String(value).trim();
  }
  if (props.modelModifiers?.number) {
    const parsed = parseFloat(String(value));
    if (!Number.isNaN(parsed)) {
      value = parsed;
    }
  }
  emit('update:modelValue', value);
};
</script>
