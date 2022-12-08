<template>
  <el-dialog
    custom-class="header-loginform"
    v-model="loginService.visible"
    title="登录"
    :close-on-click-modal="false"
    width="400px"
    :before-close="loginService.handleClose"
  >
    <!-- 登录表单 -->
    <div :class="['hl-login-form', loginService.type]">
      <ul class="hl-type">
        <li v-for="(item, index) in typeOptions" :key="'type_' + index" @click="loginService.setTab(item.value)"></li>
      </ul>

      <img class="hl-bg" src="../../../assets/images/login/login_phone.png" alt="" />
      <el-form :model="loginService.form" @submit.native.prevent>
        <el-form-item class="mb30">
          <input
            :maxlength="loginService.type === ELOGINTYPE.手机 ? 11 : 30"
            v-model="loginService.form.username"
            :placeholder="loginService.type === ELOGINTYPE.手机 ? '请输入手机号码' : '请输入邮箱'"
          />
        </el-form-item>
        <el-form-item class="mb30">
          <el-input
            v-model="loginService.form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            maxlength="32"
          />
        </el-form-item>
        <el-form-item class="mb8"> <button primary @click="loginService.submit">登录</button></el-form-item>
        <p>前往注册</p>
      </el-form>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { ELOGINTYPE } from './header-loginform.api';
import loginService from './header-loginform.service';

const typeOptions = computed(() => {
  return Object.entries(ELOGINTYPE).map(([k, v]) => {
    return {
      label: k,
      value: v,
    };
  });
});
</script>

<style lang="less">
.el-dialog.header-loginform {
  .el-dialog__body {
    height: 429px;
    padding: 0;
  }

  .hl-login-form {
    position: relative;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;

    background-size: contain;
    background-repeat: no-repeat;

    .hl-bg {
      margin: 0 auto;
    }

    .el-form {
      padding: 0 72px;

      input,
      button {
        height: 40px;
        line-height: 40px;
      }

      input,
      button,
      p {
        width: 100%;
      }

      input:focus {
        box-shadow: none;
      }

      p {
        cursor: pointer;
        text-align: right;
        height: 22px;
        line-height: 22px;
      }
    }

    hr {
      background-color: var(--color-text-diliver);
    }

    &.email {
      background-image: url(../../../assets/images/login/login-email.svg);
    }

    &.phone {
      background-image: url(../../../assets/images/login/login-phone.svg);
    }

    ul {
      display: flex;
      flex-direction: row;
      justify-content: end;

      li {
        cursor: pointer;
        width: 124px;
        height: 40px;
        line-height: 40px;

        text-align: center;
      }
    }
  }
}
</style>
