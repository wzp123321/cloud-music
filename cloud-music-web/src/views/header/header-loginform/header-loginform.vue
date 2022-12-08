<template>
  <el-dialog
    popper-class="header-loginform"
    v-model="loginService.visible"
    title="登录"
    width="600px"
    :before-close="loginService.handleClose"
  >
  </el-dialog>
</template>

<script lang="ts" setup>
import loginService from './header-loginform.service';
</script>

<style scoped lang="less">
.header-loginform {
}
</style>
