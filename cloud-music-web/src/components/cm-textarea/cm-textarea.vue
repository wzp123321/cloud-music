<template>
  <textarea :value="modelValue" @input="onInput"></textarea>
</template>

<script setup lang="ts">
/** 文本域原子组件：attrs 与 v-model 修饰符透传规则同 cm-input */
const props = defineProps<{
  modelValue?: string | number;
  modelModifiers?: { number?: boolean; trim?: boolean };
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>();

defineOptions({ name: 'CmTextarea', inheritAttrs: true });

const onInput = (event: Event) => {
  let value: string | number = (event.target as HTMLTextAreaElement).value;
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
