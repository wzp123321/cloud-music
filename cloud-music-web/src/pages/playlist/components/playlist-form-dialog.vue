<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '新建歌单' : '编辑歌单'"
    width="480px"
    @closed="onClosed"
  >
    <el-form v-loading="submitting" label-width="80px">
      <el-form-item v-if="mode === 'create' || showName" label="名称">
        <el-input v-model="form.name" maxlength="40" show-word-limit placeholder="请输入歌单名称" />
      </el-form-item>
      <el-form-item v-if="mode === 'edit'" label="简介">
        <el-input v-model="form.desc" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="请输入歌单简介" />
      </el-form-item>
      <el-form-item v-if="mode === 'edit'" label="标签">
        <el-input v-model="form.tags" placeholder="多个标签用逗号分隔，如：流行,华语" />
      </el-form-item>
      <el-form-item v-if="mode === 'create'" label="隐私">
        <el-radio-group v-model="form.privacy">
          <el-radio :label="0">公开</el-radio>
          <el-radio :label="10">隐私</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import message from '@/utils/message';
import {
  createPlaylist,
  updatePlaylistName,
  updatePlaylistDesc,
  updatePlaylistTags,
} from '@/services/playlist-manage.api';

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  playlistId?: number;
  name?: string;
  desc?: string;
  tags?: string;
  showName?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'success']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const submitting = ref(false);
const form = reactive({
  name: '',
  desc: '',
  tags: '',
  privacy: 0,
});

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.name = props.name ?? '';
      form.desc = props.desc ?? '';
      form.tags = props.tags ?? '';
      form.privacy = 0;
    }
  },
  { immediate: true },
);

const onClosed = () => {
  emit('update:modelValue', false);
};

const onSubmit = async () => {
  if (props.mode === 'create') {
    if (!form.name.trim()) {
      message.error('请输入歌单名称');
      return;
    }
    submitting.value = true;
    try {
      const res = await createPlaylist({
        name: form.name.trim(),
        privacy: form.privacy,
      });
      if (res?.code === 200) {
        message.success('创建成功');
        emit('success');
        dialogVisible.value = false;
      } else {
        message.error('创建失败');
      }
    } catch {
      message.error('创建失败，请确认已登录');
    } finally {
      submitting.value = false;
    }
    return;
  }

  // edit
  const id = props.playlistId as number;
  submitting.value = true;
  try {
    if (props.showName && form.name.trim() && form.name !== props.name) {
      await updatePlaylistName({ id, name: form.name.trim() });
    }
    if (form.desc !== (props.desc ?? '')) {
      await updatePlaylistDesc({ id, desc: form.desc });
    }
    const tags = form.tags.trim();
    if (tags !== (props.tags ?? '')) {
      await updatePlaylistTags({ id, tags });
    }
    message.success('保存成功');
    emit('success');
    dialogVisible.value = false;
  } catch {
    message.error('保存失败，请确认已登录');
  } finally {
    submitting.value = false;
  }
};
</script>
