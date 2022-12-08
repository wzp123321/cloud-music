<template>
  <el-dialog
    custom-class="header-loginform"
    v-model="loginService.visible"
    title="登录"
    :close-on-click-modal="false"
    width="540px"
    :before-close="loginService.handleClose"
  >
    <!-- 登录表单 -->
    <div :class="['hl-login-form', loginService.type]">
      <ul class="hl-type">
        <li v-for="(item, index) in typeOptions" :key="'type_' + index" @click="loginService.setTab(item.value)"></li>
      </ul>

      <el-form :model="loginService.form">
        <el-form-item>
          <input
            v-model="loginService.form.username"
            :placeholder="loginService.type === ELOGINTYPE.手机 ? '请输入手机号码' : '请输入邮箱'"
          />
        </el-form-item>
        <el-form-item>
          <input v-model="loginService.form.password" />
        </el-form-item>
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

    background-size: contain;
    background-repeat: no-repeat;

    .el-form {
      padding: 60px 72px 0;

      input {
        width: 100%;
      }
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
