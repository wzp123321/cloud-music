<template>
  <el-dialog
    v-model="loginService.visible"
    class="header-loginform"
    width="400px"
    :close-on-click-modal="false"
    :show-close="false"
    :before-close="loginService.handleClose"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="hl-header">
        <span class="hl-header--title">登录</span>
        <i class="iconfont icon-Close hl-header--close" @click="loginService.handleClose"></i>
      </div>
    </template>

    <!-- 登录方式 Tab -->
    <ul class="hl-tabs">
      <li
        v-for="item in typeOptions"
        :key="item.value"
        :class="{ active: loginService.type === item.value }"
        @click="loginService.setTab(item.value)"
      >
        {{ item.label }}
      </li>
    </ul>

    <!-- 账号密码登录 -->
    <el-form v-if="loginService.type !== ELOGINTYPE.二维码" :model="loginService.form" @submit.prevent>
      <el-form-item>
        <el-input
          v-model="loginService.form.username"
          size="large"
          :maxlength="loginService.type === ELOGINTYPE.手机 ? 11 : 30"
          :placeholder="loginService.type === ELOGINTYPE.手机 ? '请输入手机号码' : '请输入邮箱'"
          clearable
        />
      </el-form-item>
      <el-form-item>
        <el-input
          v-model="loginService.form.password"
          size="large"
          type="password"
          placeholder="请输入密码"
          show-password
          maxlength="32"
          @keyup.enter="loginService.submit"
        />
      </el-form-item>
      <button primary class="hl-submit" @click="loginService.submit">登 录</button>
      <p class="hl-register">
        没有账号？<span @click="onRegister">前往注册</span>
      </p>
    </el-form>

    <!-- 扫码登录 -->
    <div v-else class="hl-qr">
      <div class="hl-qr-img">
        <img v-if="loginService.qrImg" :src="loginService.qrImg" alt="登录二维码" />
        <el-button v-else link type="primary" @click="loginService.refreshQr()">点击刷新</el-button>
      </div>
      <p class="hl-qr-tip">{{ loginService.qrTip }}</p>
      <el-button text type="primary" @click="loginService.refreshQr()">刷新二维码</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ELOGINTYPE } from '../../../apis/header-loginform/index.api';
import { useLogin } from './hooks/useLogin';

const router = useRouter();
const loginService = useLogin();

// useLogin 是模块级单例，组件销毁不会带走轮询；卸载时必须显式停止
onUnmounted(() => loginService.stopQr());

const typeOptions = computed(() => {
  return Object.entries(ELOGINTYPE).map(([k, v]) => {
    return {
      label: k === '二维码' ? '扫码登录' : `${k}登录`,
      value: v,
    };
  });
});

/** 注册页暂无独立路由，先引导到用户中心；后续有注册页再替换 */
const onRegister = () => {
  loginService.handleClose();
  router.push('/user');
};
</script>

<style lang="less">
.el-dialog.header-loginform {
  border-radius: 12px;

  .el-dialog__header {
    padding: 20px 24px 0;
    margin-right: 0;
  }

  .el-dialog__body {
    padding: 16px 28px 28px;
  }

  .hl-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &--title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-title);
    }

    &--close {
      font-size: 16px;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: color var(--param-transition-time);

      &:hover {
        color: var(--color-text-title);
      }
    }
  }

  .hl-tabs {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--color-text-divider);

    li {
      flex: 1;
      padding: 10px 0;
      text-align: center;
      font-size: 14px;
      color: var(--color-text-primary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all var(--param-transition-time);

      &:hover {
        color: var(--color-primary);
      }

      &.active {
        color: var(--color-primary);
        font-weight: 600;
        border-bottom-color: var(--color-primary);
      }
    }
  }

  .el-form {
    .el-form-item {
      margin-bottom: 16px;
    }

    .el-input__wrapper {
      border-radius: 6px;
      padding: 0 14px;
    }

    .el-input--large {
      --el-input-height: 42px;
    }

    .hl-submit {
      width: 100%;
      height: 42px;
      margin-top: 4px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 6px;
      border-radius: 6px;
    }

    .hl-register {
      margin-top: 14px;
      text-align: center;
      font-size: 13px;
      color: var(--color-text-secondary);

      span {
        color: var(--color-primary);
        cursor: pointer;

        &:hover {
          color: var(--color-primary-hover);
        }
      }
    }
  }

  .hl-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0 8px;

    .hl-qr-img {
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--color-text-border);
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
      }
    }

    .hl-qr-tip {
      margin-top: 16px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .el-button {
      margin-top: 10px;
    }
  }
}
</style>
