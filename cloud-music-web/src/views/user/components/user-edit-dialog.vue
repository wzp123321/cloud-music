<template>
  <el-dialog :model-value="visible" title="编辑资料" width="480px" @update:model-value="onVisible">
    <el-form :model="form" label-width="64px">
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" maxlength="30" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="签名">
        <el-input
          v-model="form.signature"
          type="textarea"
          :rows="3"
          maxlength="200"
          placeholder="介绍一下自己吧"
        />
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio :label="1">男</el-radio>
          <el-radio :label="2">女</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onVisible(false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import UserService from '@/apis/user/user.service';
import { UC_IUserDetail } from '@/apis/user/user.api';
import message from '@/utils/message';

const props = defineProps<{
  visible: boolean;
  detail: UC_IUserDetail;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}>();

const saving = ref(false);
const form = ref({
  nickname: '',
  signature: '',
  gender: 0,
});

watch(
  () => props.detail,
  (v) => {
    form.value = {
      nickname: v?.profile?.nickname || '',
      signature: v?.profile?.signature || '',
      gender: v?.profile?.gender || 0,
    };
  },
  { immediate: true },
);

const onVisible = (v: boolean) => {
  emit('update:visible', v);
};

const onSave = async () => {
  if (!form.value.nickname) {
    message.error('昵称不能为空');
    return;
  }
  saving.value = true;
  try {
    const res = await UserService.updateUser({
      nickname: form.value.nickname,
      signature: form.value.signature,
      gender: form.value.gender,
    });
    if (res?.code === 200) {
      message.success('保存成功');
      emit('update:visible', false);
      emit('saved');
    } else {
      message.error(res?.message || '保存失败');
    }
  } catch {
    message.error('服务器异常');
  } finally {
    saving.value = false;
  }
};
</script>
