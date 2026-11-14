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
        <cm-icon name="icon-Close" class="hl-header--close" @click="loginService.handleClose"></cm-icon>
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
      <cm-button primary class="hl-submit" @click="loginService.submit">登 录</cm-button>
      <p class="hl-register">
        没有账号？<span @click="onRegister">前往注册</span>
      </p>
    </el-form>

    <!-- 扫码登录 -->
    <div v-else class="hl-qr">
      <div class="hl-qr-img">
        <cm-image v-if="loginService.qrImg" :src="loginService.qrImg" alt="登录二维码" />
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
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);

  .el-dialog__header {
    padding: 0;
    margin-right: 0;
  }

  .el-dialog__body {
    padding: 0 32px 32px;
  }

  .hl-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 28px 18px;
    background: linear-gradient(180deg, rgba(194, 12, 12, 0.04), transparent);
    border-bottom: 1px solid var(--color-text-divider);

    &--title {
      font-size: 19px;
      font-weight: 600;
      letter-spacing: 1px;
      color: var(--color-text-title);
    }

    &--close {
      font-size: 16px;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: color var(--param-transition-time), transform var(--param-transition-time);

      &:hover {
        color: var(--color-primary);
        transform: rotate(90deg);
      }
    }
  }

  .hl-tabs {
    display: flex;
    margin: 24px 0 22px;

    li {
      flex: 1;
      position: relative;
      padding: 12px 0;
      text-align: center;
      font-size: 15px;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: color var(--param-transition-time);

      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 24px;
        height: 3px;
        border-radius: 3px;
        background: var(--color-primary);
        transform: translateX(-50%) scaleX(0);
        transition: transform var(--param-transition-time);
      }

      &:hover {
        color: var(--color-primary);
      }

      &.active {
        color: var(--color-primary);
        font-weight: 600;

        &::after {
          transform: translateX(-50%) scaleX(1);
        }
      }
    }
  }

  .el-form {
    .el-form-item {
      margin-bottom: 18px;
    }

    .el-input__wrapper {
      border-radius: 8px;
      padding: 0 14px;
      background-color: var(--color-text-background);
      box-shadow: 0 0 0 1px var(--color-text-border) inset;
      transition: box-shadow var(--param-transition-time), background-color var(--param-transition-time);

      &:hover {
        box-shadow: 0 0 0 1px var(--color-border25) inset;
      }

      &.is-focus {
        background-color: #fff;
        box-shadow: 0 0 0 1px var(--color-primary) inset, 0 0 0 3px var(--color-box-focus);
      }
    }

    .el-input--large {
      --el-input-height: 44px;
    }

    .hl-submit {
      width: 100%;
      height: 44px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 8px;
      text-indent: 8px;
      border-radius: 8px;
      transition: box-shadow var(--param-transition-time), transform var(--param-transition-time);

      &:hover {
        box-shadow: 0 6px 16px rgba(194, 12, 12, 0.25);
      }

      &:active {
        box-shadow: 0 2px 8px rgba(194, 12, 12, 0.2);
        transform: translateY(1px);
      }
    }

    .hl-register {
      margin-top: 16px;
      text-align: center;
      font-size: 13px;
      color: var(--color-text-secondary);

      span {
        color: var(--color-primary);
        cursor: pointer;
        font-weight: 500;
        transition: color var(--param-transition-time);

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
    padding: 16px 0 8px;

    .hl-qr-img {
      width: 196px;
      height: 196px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border: 1px solid var(--color-text-divider);
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        display: block;
      }
    }

    .hl-qr-tip {
      margin-top: 18px;
      font-size: 13px;
      color: var(--color-text-secondary);
      text-align: center;
    }

    .el-button {
      margin-top: 8px;
    }
  }
}
</style>
