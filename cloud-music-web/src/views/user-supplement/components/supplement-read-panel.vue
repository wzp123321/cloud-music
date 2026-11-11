<template>
  <!-- 6.1 用户补充：4 个只读接口 + user_replacephone 写操作 -->
  <div class="user-supplement--panel">
    <p class="user-supplement--panel-tip">
      4 个需登录只读接口按接口分区；<code>user_replacephone</code> 为写操作（未登录不发请求 + 二次确认）。
    </p>

    <div class="user-supplement--grid">
      <section v-for="block in readBlocks" :key="block.code" class="user-supplement--block">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">{{ block.module }}</code> {{ block.name }}
        </h3>
        <p v-if="!hasLogin" class="user-supplement--degrade">登录后可用（已降级，不发请求）</p>
        <div class="user-supplement--block-actions">
          <button class="user-supplement--btn" @click="loadRead(block.code)">
            加载{{ block.name }}
          </button>
          <span class="user-supplement--count">{{ readLists[block.code].length }} 条</span>
        </div>
        <div v-if="readLists[block.code].length" class="user-supplement--list">
          <div
            v-for="(item, idx) in readLists[block.code]"
            :key="block.code + '_' + idx"
            class="user-supplement--item"
          >
            <span class="user-supplement--item-title">{{ item.title }}</span>
            <span class="user-supplement--item-sub">{{ item.subtitle }}</span>
            <span v-if="item.id" class="user-supplement--item-id">#{{ item.id }}</span>
          </div>
        </div>
        <p v-else class="user-supplement--empty">暂无数据或接口返回为空</p>
      </section>

      <section class="user-supplement--block user-supplement--block--wide">
        <h3 class="user-supplement--block-title">
          <code class="user-supplement--module">user_replacephone</code> 换绑手机（写操作）
        </h3>
        <div class="user-supplement--form">
          <label>新手机号 phone<input v-model="phone" placeholder="新手机号" /></label>
          <label>验证码 captcha<input v-model="captcha" placeholder="新手机验证码" /></label>
          <label>旧验证码 oldcaptcha<input v-model="oldcaptcha" placeholder="原手机验证码（可选）" /></label>
          <label>区号 countrycode<input v-model="countrycode" placeholder="如 86" /></label>
          <button
            class="user-supplement--btn user-supplement--btn--write"
            @click="doReplacePhone"
          >
            换绑手机
          </button>
        </div>
      </section>
    </div>

    <div v-if="writeResult" class="user-supplement--result">{{ writeResult }}</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

import userSupplementService from '../../../apis/user-supplement/user-supplement.service';
import { toList, useSupplementGuard, useWriteRunner, type SupplementCard } from '../use-supplement';

const props = defineProps<{
  /** 登录态：只读接口未登录直接降级，写操作同理 */
  hasLogin: boolean;
  /** 当前用户 uid，评论历史接口需要 */
  uid: string;
}>();

const emit = defineEmits<{
  (e: 'toast', message: string): void;
}>();

/** 6.1 四个需登录只读区块 */
const readBlocks = [
  { code: 'account', module: 'user_account', name: '账户信息' },
  { code: 'audio', module: 'user_audio', name: '音频足迹' },
  { code: 'dj', module: 'user_dj', name: '电台足迹' },
  { code: 'commentHistory', module: 'user_comment_history', name: '评论历史' },
];

const readLists = reactive<Record<string, SupplementCard[]>>({
  account: [],
  audio: [],
  dj: [],
  commentHistory: [],
});

const phone = ref<string>('');
const captcha = ref<string>('');
const oldcaptcha = ref<string>('');
const countrycode = ref<string>('86');
const writeResult = ref<string>('');

const { requireLogin, writeGuard } = useSupplementGuard({
  hasLogin: () => props.hasLogin,
  setToast: (message) => emit('toast', message),
});
const runWrite = useWriteRunner(writeResult, writeGuard);

/** 6.1 四个只读接口真实调用点（需登录降级） */
const loadRead = async (code: string) => {
  if (!requireLogin()) return;
  try {
    let res: any = null;
    switch (code) {
      case 'account':
        res = await userSupplementService.getUserAccount();
        break;
      case 'audio':
        res = await userSupplementService.getUserAudio({ limit: 30 });
        break;
      case 'dj':
        res = await userSupplementService.getUserDj({ limit: 30 });
        break;
      case 'commentHistory':
        res = await userSupplementService.getUserCommentHistory({ limit: 30, uid: props.uid });
        break;
      default:
        res = null;
    }
    readLists[code] = toList(res);
    emit('toast', `${code} 已加载 ${readLists[code].length} 条`);
  } catch {
    readLists[code] = [];
    emit('toast', '接口请求失败，已返回空值');
  }
};

/** 6.1 user_replacephone 写操作调用点 */
const doReplacePhone = () =>
  runWrite('user_replacephone 换绑手机', () =>
    userSupplementService.replacePhone({
      phone: phone.value,
      captcha: captcha.value,
      oldcaptcha: oldcaptcha.value,
      countrycode: countrycode.value,
    }),
  );
</script>
