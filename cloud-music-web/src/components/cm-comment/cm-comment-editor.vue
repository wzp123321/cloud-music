<template>
  <!-- 发评编辑器：文本域 + 提示 + 发布按钮 -->
  <div class="cmc-editor">
    <cm-textarea
      :value="modelValue"
      rows="3"
      maxlength="500"
      placeholder="发表你的评论..."
      @input="onInput"
    ></cm-textarea>
    <div class="cmc-editor-bar">
      <span class="cmc-tip">{{ tip }}</span>
      <cm-button class="cmc-submit" :disabled="posting" @click="emit('submit')">
        {{ posting ? '发布中' : '发布评论' }}
      </cm-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  /** v-model 绑定的草稿内容 */
  modelValue: {
    type: String,
    default: '',
  },
  /** 是否发布中（禁用按钮） */
  posting: {
    type: Boolean,
    default: false,
  },
  /** 编辑器提示文案 */
  tip: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}>();

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
};
</script>

<style scoped lang="less">
.cmc-editor {
  textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    padding: 10px 12px;
    border: 1px solid var(--color-text-divider);
    border-radius: 6px;
    font-size: 14px;
    line-height: 22px;
    color: var(--color-text);
    background: transparent;
    outline: none;
  }
}

.cmc-editor-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;

  .cmc-tip {
    font-size: 12px;
    color: var(--color-primary-active);
  }

  .cmc-submit {
    padding: 6px 18px;
    border: none;
    border-radius: 16px;
    font-size: 13px;
    color: #fff;
    background: var(--color-primary-active);
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
