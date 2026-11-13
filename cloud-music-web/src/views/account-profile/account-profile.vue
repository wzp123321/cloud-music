<template>
  <api-console-page title="账号资料" :blocks="blocks" :tabs="tabs"
    :kind-labels="kindLabels"
  >
    <template #intro>
      共 15 个接口（任务 7.1 验证与注册前置 6 个、7.2 账号资料与签到 9 个），按 capability
      分组切换，每个区块标注 module 名并对应一个真实接口调用点。 当前登录状态：<b>{{
        loggedIn ? '已登录' : '未登录'
      }}</b
      >。
      <b>账号动作安全红线</b>：<code>register_*</code>、<code>captcha_*</code>、<code>cellphone_existence_check</code>、
      <code>rebind</code>、<code>activate_init_profile</code>、<code>signin_progress</code>、<code>setting</code>、
      <code>daily_signin</code> 等一律按写操作处理——未登录降级不发请求、必须用户主动点击 +
      <code>window.confirm</code> 二次确认、 禁止 <code>onMounted</code>
      自动调用、禁止预填真实手机号（输入框一律留空手动填写）。
      <code>verify_getQr</code> / <code>verify_qrcodestatus</code> / <code>countries_code_list</code> 为只读。
      路由例外：<code>daily_signin → /daily_signin</code>（下划线，不是 /daily/signin）。
    
    </template>
    <template #foot>
      说明：账号动作类写操作按钮会先判断是否登录，再弹出 window.confirm
      二次确认，确认后才发请求； 只读接口（二维码 / 二维码状态 /
      国家区号）可按钮触发或自动加载；每个请求独立 try/catch，失败降级为空值。
      为规避误触发真实注册/换绑/短信流程，所有手机号输入框均不预填任何真实号码。
    
    </template>
  </api-console-page>
</template>

<script setup lang="ts">
import ApiConsolePage from '@/components/api-console-page/api-console-page.vue';
import { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { blocks, kindLabels, tabs } from './account-profile.blocks';

const loggedIn = hasLogin();
</script>
