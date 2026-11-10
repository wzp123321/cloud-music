import { ref } from 'vue';

import { postRequest } from '@/services/request';
import { ELOGINTYPE, EQRSTATUS, Header_ILoginVO, HL_ILoginUserVO } from './header-loginform.api';
import UserService from '@/services/user.service';

enum EPath {
  手机号码登陆 = '/login/cellphone',
  邮箱登陆 = '/login',
}

import message from '@/utils/message';
import { useUserStore } from '@/stores/user';

const QR_POLL_INTERVAL = 2000;

// 创建登录弹窗共享状态：响应式数据统一用 ref，行为统一为 const 箭头函数
const create = () => {
  //#region 登录结果（$ 字段对外保持为 Ref，供组件 watch 订阅）
  const _loginResult = ref<HL_ILoginUserVO>({});
  //#endregion
  //#region 基础状态
  const _visible = ref<boolean>(false);
  const _type = ref<string>(ELOGINTYPE.邮箱);
  const _form = ref<Header_ILoginVO>({
    username: '',
    password: '',
  });
  //#endregion

  //#region 二维码登录状态
  const _qrImg = ref<string>('');
  const _qrTip = ref<string>('请使用网易云音乐 APP 扫码登录');
  /** 轮询定时器与二维码 key（非响应式状态） */
  let qrPolling: ReturnType<typeof setInterval> | null = null;
  let qrKey = '';
  //#endregion

  const show = () => {
    _type.value = ELOGINTYPE.邮箱;
    _visible.value = true;
  };

  /** 统一的登录成功处理：cookie 与登录态收敛到 user store，再关闭弹窗 */
  const onLoginSuccess = (profile: any) => {
    if (!profile) return;
    useUserStore().setLogin(profile);
    _loginResult.value = { profile };
    _visible.value = false;
  };

  /** 停止轮询 */
  const stopQr = () => {
    if (qrPolling) {
      clearInterval(qrPolling);
      qrPolling = null;
    }
  };

  /** 用户主动刷新二维码 */
  const refreshQr = () => {
    startQrLogin();
  };

  const handleClose = () => {
    stopQr();
    _visible.value = false;
  };

  const setTab = (value: string) => {
    if (_type.value !== value) {
      _type.value = value;
      if (value === ELOGINTYPE.二维码) {
        startQrLogin();
      } else {
        stopQr();
      }
    }
  };

  const handlePhoneLogin = async () => {
    try {
      const res = await postRequest(EPath.手机号码登陆, {
        phone: _form.value.username,
        password: _form.value.password,
      });
      if (res?.code !== 200) {
        message.error(res?.message);
      } else {
        message.success('登录成功');
        onLoginSuccess(res?.profile);
      }
    } catch {
      message.error('服务器异常');
    }
  };

  const handleEmailLogin = async () => {
    try {
      const res = await postRequest(EPath.邮箱登陆, {
        email: _form.value.username,
        password: _form.value.password,
      });
      if (res?.code !== 200) {
        message.error(res?.message);
      }
    } catch {
      message.error('服务器异常');
    }
  };

  const submit = () => {
    if (!_form.value.username) {
      message.error(_type.value === ELOGINTYPE.手机 ? '请输入手机号码' : '请输入邮箱');
      return;
    }
    if (!_form.value.password) {
      message.error('请输入密码');
      return;
    }
    if (_type.value === ELOGINTYPE.手机) {
      handlePhoneLogin();
    } else {
      handleEmailLogin();
    }
  };

  //#region 二维码登录
  /** 开始二维码登录：生成 key -> 生成二维码 -> 轮询 */
  const startQrLogin = async () => {
    stopQr();
    _qrTip.value = '请使用网易云音乐 APP 扫码登录';
    try {
      const keyRes = await UserService.getQrKey();
      qrKey = keyRes?.unikey || '';
      if (!qrKey) {
        _qrTip.value = '获取二维码失败，请稍后重试';
        return;
      }
      const createRes = await UserService.getQrCreate(qrKey, true);
      _qrImg.value = createRes?.qrimg || '';
      pollQr();
    } catch {
      _qrTip.value = '获取二维码失败，请稍后重试';
    }
  };

  /** 二维码登录成功后，拉取最新登录态并写入 */
  const onQrLoginSuccess = async () => {
    try {
      const status = await UserService.loginStatus();
      if (status?.code === 200 && status?.data?.profile) {
        message.success('登录成功');
        onLoginSuccess(status.data.profile);
      } else {
        _qrTip.value = '登录失败，请重试';
        startQrLogin();
      }
    } catch {
      _qrTip.value = '登录失败，请重试';
      startQrLogin();
    }
  };

  /** 轮询扫码状态 */
  const pollQr = () => {
    stopQr();
    qrPolling = setInterval(async () => {
      if (!qrKey) return;
      try {
        const res = await UserService.checkQr(qrKey);
        switch (res?.code) {
          case EQRSTATUS.过期:
            _qrTip.value = '二维码已过期，正在刷新...';
            startQrLogin();
            break;
          case EQRSTATUS.等待扫码:
            _qrTip.value = '请使用网易云音乐 APP 扫码登录';
            break;
          case EQRSTATUS.待确认:
            _qrTip.value = '已扫码，请在手机上确认登录';
            break;
          case EQRSTATUS.成功:
            stopQr();
            await onQrLoginSuccess();
            break;
          default:
            break;
        }
      } catch {
        // 单次轮询失败忽略，继续下一次
      }
    }, QR_POLL_INTERVAL);
  };
  //#endregion

  // 返回普通对象：值字段用 getter 包装为「值」，loginResult$ 直接放 Ref 不被解包
  const state = {
    loginResult$: _loginResult,
    get visible(): boolean {
      return _visible.value;
    },
    set visible(value: boolean) {
      _visible.value = value;
    },
    get type(): string {
      return _type.value;
    },
    get form(): Header_ILoginVO {
      return _form.value;
    },
    get qrImg(): string {
      return _qrImg.value;
    },
    get qrTip(): string {
      return _qrTip.value;
    },
    show,
    handleClose,
    setTab,
    submit,
    handlePhoneLogin,
    handleEmailLogin,
    startQrLogin,
    stopQr,
    refreshQr,
  };
  return state;
};

// 模块级缓存：保证跨组件共享同一实例
let shared: ReturnType<typeof create> | null = null;
export const useLogin = () => (shared ??= create());
