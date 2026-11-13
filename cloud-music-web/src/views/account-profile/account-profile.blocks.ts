/*
 * @Description: 账号资料台 · 15 个接口区块定义（纯数据）
 * 写操作 / 账号动作：register_* / captcha_* / cellphone_existence_check / rebind / activate_init_profile /
 *   signin_progress / setting / daily_signin —— 未登录 hasLogin() 降级、点击 window.confirm 二次确认、
 *   禁止 onMounted 自动调用、禁止预填真实手机号（所有输入框 def 均为空）。
 * 只读：verify_getQr / verify_qrcodestatus / countries_code_list / nickname_check / sign_happy_info。
 * 路由例外：daily_signin -> /daily_signin（下划线）。
 * 参数来源：verify_qrcodestatus 的 key ← verify_getQr 返回（qrKey）或页面输入。
 */
import type { ApiBlock } from '@/components/cm-api-block/api-block.types';

import accountProfileService from '../../apis/account-profile/account-profile.service';

/** 分组 tab：code 与区块的 tab 字段对应 */
export const tabs: { code: string; name: string }[] = [
  { code: '7.1', name: '7.1 验证与注册前置（6）' },
  { code: '7.2', name: '7.2 账号资料与签到（9）' },
];

/** 账号动作类页面把 write 类型标注得更明确 */
export const kindLabels = { write: '写操作/账号动作' };

export const blocks: ApiBlock[] = [
  // 7.1 验证与注册前置（6）
  {
    module: 'verify_getQr',
    title: '获取登录二维码',
    desc: '已失效：上游 /verify/getQr 实测 404，不进主流程自动请求',
    tab: '7.1',
    kind: 'invalid',
    url: '/verify/getQr',
    buttonText: '查看失效说明/核验',
    note: '已登记失效（上游 /verify/getQr 404）：不进主流程自动请求，本按钮需二次确认后仅手动核验一次，结果按空值处理；二维码 key 链路暂不可用',
    provides: ['qrKey'],
    params: () => ({}),
    run: accountProfileService.getVerifyQr,
  },
  {
    module: 'verify_qrcodestatus',
    title: '查询二维码状态',
    desc: '只读：key ← verify_getQr 返回（qrKey）/ 页面输入',
    tab: '7.1',
    kind: 'read',
    url: '/verify/qrcodestatus',
    needs: 'qrKey',
    source: 'verify_getQr / 手动输入',
    input: { label: '二维码 key（默认取参数池 qrKey，可手动输入）', def: '' },
    params: (s, v) => ({ key: v || s.qrKey || '' }),
    run: accountProfileService.getVerifyQrStatus,
  },
  {
    module: 'countries_code_list',
    title: '国家区号列表',
    desc: '只读：应用启动即可自动加载的静态列表',
    tab: '7.1',
    kind: 'read',
    url: '/countries/code/list',
    auto: true,
    params: () => ({}),
    run: accountProfileService.getCountryCodeList,
  },
  {
    module: 'captcha_sent',
    title: '发送验证码',
    desc: '账号动作（按写操作）：需登录 + 二次确认；手机号手动输入、不预填',
    tab: '7.1',
    kind: 'write',
    url: '/captcha/sent',
    input: { label: '手机号（手动输入，不预填真实号码）', def: '' },
    params: (_s, v) => ({ phone: v }),
    confirmMsg: '该操作会触发短信验证码下发（账号动作/写操作），确认继续吗？',
    run: accountProfileService.sendCaptcha,
  },
  {
    module: 'captcha_verify',
    title: '校验验证码',
    desc: '账号动作（按写操作）：需登录 + 二次确认；手机号/验证码手动输入、不预填',
    tab: '7.1',
    kind: 'write',
    url: '/captcha/verify',
    input: { label: '手机号,验证码（逗号分隔，手动输入，不预填）', def: '' },
    params: (_s, v) => {
      const parts = v.split(',').map((x) => x.trim());
      return { phone: parts[0] || '', captcha: parts[1] || '' };
    },
    confirmMsg: '该操作会校验短信验证码（账号动作/写操作），确认继续吗？',
    run: accountProfileService.verifyCaptcha,
  },
  {
    module: 'cellphone_existence_check',
    title: '手机号存在性检查',
    desc: '账号动作（按写操作）：需登录 + 二次确认；手机号手动输入、不预填',
    tab: '7.1',
    kind: 'write',
    url: '/cellphone/existence/check',
    input: { label: '手机号（手动输入，不预填真实号码）', def: '' },
    params: (_s, v) => ({ phone: v }),
    confirmMsg: '确认执行手机号存在性检查（账号动作/写操作）吗？',
    run: accountProfileService.checkCellphoneExistence,
  },

  // 7.2 账号资料与签到（9）
  {
    module: 'register_anonimous',
    title: '匿名注册',
    desc: '账号动作（按写操作）：需登录 + 二次确认；禁止自动调用',
    tab: '7.2',
    kind: 'write',
    url: '/register/anonimous',
    params: () => ({}),
    confirmMsg: '该操作会触发匿名注册（账号动作/写操作），确认继续吗？',
    run: accountProfileService.registerAnonymous,
  },
  {
    module: 'register_cellphone',
    title: '手机号注册',
    desc: '账号动作（按写操作）：需登录 + 二次确认；手机号/验证码/昵称手动输入、不预填',
    tab: '7.2',
    kind: 'write',
    url: '/register/cellphone',
    input: { label: '手机号,验证码,昵称（逗号分隔，手动输入，不预填）', def: '' },
    params: (_s, v) => {
      const parts = v.split(',').map((x) => x.trim());
      return { phone: parts[0] || '', captcha: parts[1] || '', nickname: parts[2] || '' };
    },
    confirmMsg: '该操作会触发手机号注册（账号动作/写操作），确认继续吗？',
    run: accountProfileService.registerCellphone,
  },
  {
    module: 'rebind',
    title: '换绑手机号',
    desc: '账号动作（按写操作）：需登录 + 二次确认；原号/新号/验证码手动输入、不预填',
    tab: '7.2',
    kind: 'write',
    url: '/rebind',
    input: { label: '原手机号,新手机号,验证码（逗号分隔，手动输入，不预填）', def: '' },
    params: (_s, v) => {
      const parts = v.split(',').map((x) => x.trim());
      return { oldphone: parts[0] || '', phone: parts[1] || '', captcha: parts[2] || '' };
    },
    confirmMsg: '该操作会触发手机号换绑（账号动作/写操作），确认继续吗？',
    run: accountProfileService.rebindCellphone,
  },
  {
    module: 'nickname_check',
    title: '昵称可用性检测',
    desc: '只读：检查昵称是否可用；昵称手动输入',
    tab: '7.2',
    kind: 'read',
    url: '/nickname/check',
    input: { label: '昵称（手动输入）', def: '' },
    params: (_s, v) => ({ nickname: v }),
    run: accountProfileService.checkNickname,
  },
  {
    module: 'activate_init_profile',
    title: '初始化用户资料',
    desc: '账号动作（按写操作）：需登录 + 二次确认；昵称手动输入',
    tab: '7.2',
    kind: 'write',
    url: '/activate/init/profile',
    input: { label: '昵称（手动输入，不预填）', def: '' },
    params: (_s, v) => ({ nickname: v }),
    confirmMsg: '该操作会初始化用户资料（账号动作/写操作），确认继续吗？',
    run: accountProfileService.activateInitProfile,
  },
  {
    module: 'sign_happy_info',
    title: '签到彩蛋信息',
    desc: '只读：查询签到彩蛋信息',
    tab: '7.2',
    kind: 'read',
    url: '/sign/happy/info',
    params: () => ({}),
    run: accountProfileService.getSignHappyInfo,
  },
  {
    module: 'signin_progress',
    title: '签到进度',
    desc: '账号动作（按写操作）：需登录 + 二次确认；禁止自动调用',
    tab: '7.2',
    kind: 'write',
    url: '/signin/progress',
    params: () => ({}),
    confirmMsg: '确认查询/提交签到进度（账号动作/写操作）吗？',
    run: accountProfileService.getSigninProgress,
  },
  {
    module: 'setting',
    title: '账号设置',
    desc: '账号动作（按写操作）：需登录 + 二次确认；设置项手动输入',
    tab: '7.2',
    kind: 'write',
    url: '/setting',
    input: { label: '设置项（手动输入）', def: '' },
    params: (_s, v) => (v ? { value: v } : {}),
    confirmMsg: '该操作会修改账号设置（账号动作/写操作），确认继续吗？',
    run: accountProfileService.updateSetting,
  },
  {
    module: 'daily_signin',
    title: '每日签到',
    desc: '账号签到写操作：需登录 + 二次确认；特殊路由 /daily_signin（下划线，不是 /daily/signin）',
    tab: '7.2',
    kind: 'write',
    url: '/daily_signin',
    params: () => ({}),
    confirmMsg: '确认执行每日签到（写操作）吗？',
    run: accountProfileService.dailySignin,
  },
];
