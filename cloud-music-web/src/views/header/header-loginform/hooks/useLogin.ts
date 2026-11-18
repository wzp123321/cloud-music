import { useSingletonStore } from '@/store/singletons';
import type { ApiRawResponse } from '@/apis/types';
import { ref, watch } from 'vue';

import { setNcmCookie } from '@/core/ncm-cookie';
import { postRequest } from '@/apis/request';
import { ELOGINTYPE, EQRSTATUS, Header_ILoginVO, HL_LoginUserVO } from '../../../../apis/header-loginform/index.api';
import UserService from '@/apis/user/user.service';

enum EPath {
  手机号码登陆 = '/login/cellphone',
  邮箱登陆 = '/login',
}

import message from '@/utils/message';
import { useUserStore } from '@/store/user';

const qrPollInterval = 2000;

// 创建登录弹窗共享状态：响应式数据统一用 ref，行为统一为 const 箭头函数
const create = () => {
  //#region 登录结果（$ 字段对外保持为 Ref，供组件 watch 订阅）
  const loginResult$ = ref<HL_LoginUserVO>({});
  //#endregion
  //#region 基础状态
  const visible = ref<boolean>(false);
  const type = ref<string>(ELOGINTYPE.邮箱);
  const form = ref<Header_ILoginVO>({
    username: '',
    password: '',
  });
  /** 提交锁：请求在途时拦截重复点击 */
  const submitting = ref(false);
  //#endregion

  //#region 二维码登录状态
  const qrImg = ref<string>('');
  const qrTip = ref<string>('请使用网易云音乐 APP 扫码登录');
  /** 轮询定时器与二维码 key（非响应式状态） */
  let qrPolling: ReturnType<typeof setInterval> | null = null;
  let qrKey = '';
  let qrFailCount = 0; // 连续轮询失败计数：超阈值给提示，避免长时间静默卡死
  //#endregion

  const show = () => {
    type.value = ELOGINTYPE.邮箱;
    visible.value = true;
  };

  /**
   * 统一的登录成功处理：会话凭证与登录态收敛到 user store，再关闭弹窗
   * @param profile 用户资料
   * @param sessionCookie 登录接口响应体里的 cookie 串（MUSIC_U 等）
   */
  const onLoginSuccess = (profile: ApiRawResponse, sessionCookie?: string) => {
    if (!profile) return;
    useUserStore().setLogin(profile, sessionCookie);
    loginResult$.value = { profile };
    visible.value = false;
  };

  /** 停止轮询 */
  const stopQr = () => {
    if (qrPolling) {
      clearInterval(qrPolling);
      qrPolling = null;
    }
  };

  // 弹窗关闭即停轮询：单例常驻于 header，组件未必卸载，仅靠 onUnmounted 兜不住。
  // 同时避免「二维码过期 -> startQrLogin 自动续期」在弹窗已关闭时无限重启。
  watch(visible, (visible) => {
    if (!visible) stopQr();
  });

  /** 用户主动刷新二维码 */
  const refreshQr = () => {
    startQrLogin();
  };

  const handleClose = () => {
    stopQr();
    visible.value = false;
  };

  const setTab = (value: string) => {
    if (type.value !== value) {
      type.value = value;
      if (value === ELOGINTYPE.二维码) {
        startQrLogin();
      } else {
        stopQr();
      }
    }
  };

  const phonePattern = /^1[3-9]\d{9}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handlePhoneLogin = async () => {
    if (submitting.value) return;
    const username = form.value.username.trim();
    if (!username) {
      message.info('请输入手机号码');
      return;
    }
    if (!phonePattern.test(username)) {
      message.info('手机号格式不正确');
      return;
    }
    if (!form.value.password) {
      message.info('请输入密码');
      return;
    }
    submitting.value = true;
    try {
      const res = await postRequest(EPath.手机号码登陆, {
        phone: form.value.username,
        password: form.value.password,
      });
      if (res?.code !== 200) {
        message.error(res?.message);
      } else {
        // 与扫码 803 同理：/login/cellphone 的 body.cookie 才是上游会话凭证
        if (res?.cookie) {
          setNcmCookie(res.cookie);
        }
        message.success('登录成功');
        onLoginSuccess(res?.profile, res?.cookie);
      }
    } catch {
      message.error('服务器异常');
    } finally {
      submitting.value = false;
    }
  };

  const handleEmailLogin = async () => {
    if (submitting.value) return;
    const username = form.value.username.trim();
    if (!username) {
      message.info('请输入邮箱');
      return;
    }
    if (!emailPattern.test(username)) {
      message.info('邮箱格式不正确');
      return;
    }
    if (!form.value.password) {
      message.info('请输入密码');
      return;
    }
    submitting.value = true;
    try {
      const res = await postRequest(EPath.邮箱登陆, {
        email: form.value.username,
        password: form.value.password,
      });
      if (res?.code !== 200) {
        message.error(res?.message);
      } else {
        // /login 的 body.cookie 才是上游会话凭证
        if (res?.cookie) {
          setNcmCookie(res.cookie);
        }
        message.success('登录成功');
        onLoginSuccess(res?.profile, res?.cookie);
      }
    } catch {
      message.error('服务器异常');
    } finally {
      submitting.value = false;
    }
  };

  const submit = () => {
    if (type.value === ELOGINTYPE.手机) {
      handlePhoneLogin();
    } else {
      handleEmailLogin();
    }
  };

  //#region 二维码登录
  /** 开始二维码登录：生成 key -> 生成二维码 -> 轮询 */
  const startQrLogin = async () => {
    stopQr();
    qrTip.value = '请使用网易云音乐 APP 扫码登录';
    try {
      const keyRes = await UserService.getQrKey();
      qrKey = keyRes?.unikey || '';
      if (!qrKey) {
        qrTip.value = '获取二维码失败，请稍后重试';
        return;
      }
      const createRes = await UserService.getQrCreate(qrKey, true);
      qrImg.value = createRes?.qrimg || '';
      pollQr();
    } catch {
      qrTip.value = '获取二维码失败，请稍后重试';
    }
  };

  /** 二维码登录成功后，拉取最新登录态并写入 */
  const onQrLoginSuccess = async (sessionCookie?: string) => {
    try {
      const status = await UserService.loginStatus();
      if (status?.code === 200 && status?.data?.profile) {
        message.success('登录成功');
        onLoginSuccess(status.data.profile, sessionCookie);
      } else {
        qrTip.value = '登录失败，请重试';
        startQrLogin();
      }
    } catch {
      qrTip.value = '登录失败，请重试';
      startQrLogin();
    }
  };

  /** 轮询扫码状态 */
  const pollQr = () => {
    stopQr();
    qrPolling = setInterval(async () => {
      // 弹窗已关闭时，即使回调正在 await 中也必须停止，防止过期分支重启轮询
      if (!visible.value) {
        stopQr();
        return;
      }
      if (!qrKey) return;
      try {
        const res = await UserService.checkQr(qrKey);
        qrFailCount = 0; // 任意正常响应都重置失败计数
        switch (res?.code) {
          case EQRSTATUS.过期:
            qrTip.value = '二维码已过期，正在刷新...';
            startQrLogin();
            break;
          case EQRSTATUS.等待扫码:
            qrTip.value = '请使用网易云音乐 APP 扫码登录';
            break;
          case EQRSTATUS.待确认:
            qrTip.value = '已扫码，请在手机上确认登录';
            break;
          case EQRSTATUS.成功:
            stopQr();
            // checkQr 在 803 时同时下发 MUSIC_U，顺手持久化，避免只依赖浏览器 cookie
            await onQrLoginSuccess(res?.cookie);
            break;
          default:
            break;
        }
      } catch {
        // 轮询失败（网络/服务异常）：累计计数，超阈值提示并刷新，避免静默卡死
        qrFailCount += 1;
        if (qrFailCount >= 5) {
          message.error('二维码登录请求异常，正在刷新');
          qrTip.value = '登录请求异常，正在刷新...';
          qrFailCount = 0;
          startQrLogin();
        }
      }
    }, qrPollInterval);
  };
  //#endregion

  return {
    loginResult$,
    visible,
    type,
    form,
    submitting,
    qrImg,
    qrTip,
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
};

export const useLogin = () => useSingletonStore().get('useLogin', create);
