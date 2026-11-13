import { getRequest } from '@/apis/request';

/**
 * P2 7.x「账号资料」接口封装（共 15 个）。
 *
 * URL 规则：module 文件名下划线转斜杠；完整清单见 api-inventory-plain.md，禁止凭记忆猜 URL。
 * 特殊路由例外：daily_signin -> /daily_signin （不是 /daily/signin，写下划线否则 404）。
 *
 * 统一约定：
 * - 一律 getRequest(url, params)；每个请求 try/catch，失败返回空对象 {}；
 * - 返回体保持原始结构，由页面 normalize() 兼容 res.data / res.result / res.xxx；
 * - 账号动作（register_* / captcha_* / cellphone_existence_check / rebind / activate_init_profile /
 *   signin_progress / setting / daily_signin）一律按写操作处理：是否发出请求由页面根据
 *   hasLogin() + window.confirm 控制；禁止 onMounted 自动调用、禁止预填真实手机号；
 * - verify_getQr / verify_qrcodestatus / countries_code_list / nickname_check / sign_happy_info 为只读。
 */
const call = async (url: string, params: Record<string, unknown> = {}): Promise<any> => {
  try {
    const res = await getRequest(url, params);
    return res ?? {};
  } catch {
    // 上游异常，降级为空对象，避免未捕获异常打断页面（响应拦截器统一提示，此处不重复 message.error）
    return {};
  }
}

const accountProfileService = {
  //#region 7.1 验证与注册前置（6）
  /** 获取登录二维码 key（只读） */
  getVerifyQr: (p: Record<string, any> = {}) => call('/verify/getQr', p),
  /** 查询二维码状态（只读）：key ← verify_getQr / 页面输入 */
  getVerifyQrStatus: (p: Record<string, any> = {}) => call('/verify/qrcodestatus', p),
  /** 发送验证码（账号动作/写操作）：需登录 + 二次确认，禁止预填真实手机号 */
  sendCaptcha: (p: Record<string, any> = {}) => call('/captcha/sent', p),
  /** 校验验证码（账号动作/写操作）：需登录 + 二次确认 */
  verifyCaptcha: (p: Record<string, any> = {}) => call('/captcha/verify', p),
  /** 国家区号列表（只读） */
  getCountryCodeList: (p: Record<string, any> = {}) => call('/countries/code/list', p),
  /** 手机号存在性检查（账号动作/写操作）：需登录 + 二次确认，禁止预填真实手机号 */
  checkCellphoneExistence: (p: Record<string, any> = {}) => call('/cellphone/existence/check', p),
  //#endregion

  //#region 7.2 账号资料与签到（9）
  /** 匿名注册（账号动作/写操作）：需登录 + 二次确认 */
  registerAnonymous: (p: Record<string, any> = {}) => call('/register/anonimous', p),
  /** 手机号注册（账号动作/写操作）：需登录 + 二次确认，禁止预填真实手机号 */
  registerCellphone: (p: Record<string, any> = {}) => call('/register/cellphone', p),
  /** 换绑手机号（账号动作/写操作）：需登录 + 二次确认，禁止预填真实手机号 */
  rebindCellphone: (p: Record<string, any> = {}) => call('/rebind', p),
  /** 昵称可用性检测（只读）：nickname ← 页面输入 */
  checkNickname: (p: Record<string, any> = {}) => call('/nickname/check', p),
  /** 初始化用户资料（账号动作/写操作）：需登录 + 二次确认 */
  activateInitProfile: (p: Record<string, any> = {}) => call('/activate/init/profile', p),
  /** 签到彩蛋信息（只读） */
  getSignHappyInfo: (p: Record<string, any> = {}) => call('/sign/happy/info', p),
  /** 签到进度（账号动作/写操作）：需登录 + 二次确认 */
  getSigninProgress: (p: Record<string, any> = {}) => call('/signin/progress', p),
  /** 账号设置（账号动作/写操作）：需登录 + 二次确认 */
  updateSetting: (p: Record<string, any> = {}) => call('/setting', p),
  /** 每日签到（写操作，特殊路由 /daily_signin）：需登录 + 二次确认 */
  dailySignin: (p: Record<string, any> = {}) => call('/daily_signin', p),
  //#endregion
};

export default accountProfileService;
