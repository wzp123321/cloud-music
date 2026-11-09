import { ref } from 'vue';
import { Observable, BehaviorSubject } from 'rxjs';

import { postRequest } from '@/services/request';
import { ELOGINTYPE, EQRSTATUS, Header_ILoginVO, HL_ILoginUserVO } from './header-loginform.api';
import UserService from '@/services/user.service';

enum EPath {
  手机号码登陆 = '/login/cellphone',
  邮箱登陆 = '/login',
}

import message from '@/utils/message';
import { FSetCookie } from '@/core/token';

const QR_POLL_INTERVAL = 2000;

class LoginService {
  //#region
  private _loginResult$ = new BehaviorSubject<HL_ILoginUserVO>({});

  public get loginResult$() {
    return this._loginResult$ as unknown as Observable<HL_ILoginUserVO>;
  }
  //#region
  private _visible = ref<boolean>(false);

  private _type = ref<string>(ELOGINTYPE.邮箱);

  private _form = ref<Header_ILoginVO>({
    username: '',
    password: '',
  });

  public get visible(): boolean {
    return this._visible.value;
  }

  public set visible(value: boolean) {
    this._visible.value = value;
  }

  public get type(): string {
    return this._type.value;
  }

  public get form(): Header_ILoginVO {
    return this._form.value;
  }
  //#endregion

  //#region 二维码登录状态
  private _qrImg = ref<string>('');
  private _qrTip = ref<string>('请使用网易云音乐 APP 扫码登录');
  private _qrPolling: ReturnType<typeof setInterval> | null = null;
  private _qrKey = '';

  public get qrImg(): string {
    return this._qrImg.value;
  }
  public get qrTip(): string {
    return this._qrTip.value;
  }
  //#endregion

  show() {
    this._type.value = ELOGINTYPE.邮箱;
    this._visible.value = true;
  }

  handleClose = () => {
    this.stopQr();
    this._visible.value = false;
  };

  setTab(value: string) {
    if (this._type.value !== value) {
      this._type.value = value;
      if (value === ELOGINTYPE.二维码) {
        this.startQrLogin();
      } else {
        this.stopQr();
      }
    }
  }

  submit() {
    if (!this._form.value.username) {
      message.error(this._type.value === ELOGINTYPE.手机 ? '请输入手机号码' : '请输入邮箱');
      return;
    }
    if (!this._form.value.password) {
      message.error('请输入密码');
      return;
    }
    if (this._type.value === ELOGINTYPE.手机) {
      this.handlePhoneLogin();
    } else {
      this.handleEmailLogin();
    }
  }

  async handlePhoneLogin() {
    try {
      const res = await postRequest(EPath.手机号码登陆, {
        phone: this._form.value.username,
        password: this._form.value.password,
      });
      if (res?.code !== 200) {
        message.error(res?.message);
      } else {
        message.success('登录成功');
        this.onLoginSuccess(res?.profile);
      }
    } catch (error) {
      message.error('服务器异常');
    }
  }

  async handleEmailLogin() {
    try {
      const res = await postRequest(EPath.邮箱登陆, {
        email: this._form.value.username,
        password: this._form.value.password,
      });
      if (res?.code !== 200) {
        message.error(res?.message);
      }
    } catch (error) {
      message.error('服务器异常');
    }
  }

  /** 统一的登录成功处理：写 cookie + 推送登录态 + 关闭弹窗 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onLoginSuccess(profile: any) {
    if (!profile) return;
    FSetCookie('cloud-token', JSON.stringify(profile));
    FSetCookie(
      'cloud-userInfo',
      JSON.stringify({
        profile: {
          backgroundUrl: profile.backgroundUrl,
          vipType: profile.vipType,
          authStatus: profile.authStatus,
          djStatus: profile.djStatus,
          detailDescription: profile.detailDescription,
          accountStatus: profile.accountStatus,
          nickname: profile.nickname,
          birthday: profile.birthday,
          gender: profile.gender,
          province: profile.province,
          city: profile.city,
          avatarUrl: profile.avatarUrl,
          userType: profile.userType,
          defaultAvatar: profile.defaultAvatar,
          description: profile.description,
          userId: profile.userId,
          authority: profile.authority,
          followeds: profile.followeds,
          follows: profile.follows,
          eventCount: profile.eventCount,
          playlistCount: profile.playlistCount,
          playlistBeSubscribedCount: profile.playlistBeSubscribedCount,
        },
      }),
    );

    this._loginResult$.next({ profile });
    this._visible.value = false;
  }

  //#region 二维码登录
  /** 开始二维码登录：生成 key -> 生成二维码 -> 轮询 */
  async startQrLogin() {
    this.stopQr();
    this._qrTip.value = '请使用网易云音乐 APP 扫码登录';
    try {
      const keyRes = await UserService.getQrKey();
      this._qrKey = keyRes?.unikey || '';
      if (!this._qrKey) {
        this._qrTip.value = '获取二维码失败，请稍后重试';
        return;
      }
      const createRes = await UserService.getQrCreate(this._qrKey, true);
      this._qrImg.value = createRes?.qrimg || '';
      this.pollQr();
    } catch {
      this._qrTip.value = '获取二维码失败，请稍后重试';
    }
  }

  /** 轮询扫码状态 */
  private pollQr() {
    this.stopQr();
    this._qrPolling = setInterval(async () => {
      if (!this._qrKey) return;
      try {
        const res = await UserService.checkQr(this._qrKey);
        switch (res?.code) {
          case EQRSTATUS.过期:
            this._qrTip.value = '二维码已过期，正在刷新...';
            this.startQrLogin();
            break;
          case EQRSTATUS.等待扫码:
            this._qrTip.value = '请使用网易云音乐 APP 扫码登录';
            break;
          case EQRSTATUS.待确认:
            this._qrTip.value = '已扫码，请在手机上确认登录';
            break;
          case EQRSTATUS.成功:
            this.stopQr();
            await this.onQrLoginSuccess();
            break;
          default:
            break;
        }
      } catch {
        // 单次轮询失败忽略，继续下一次
      }
    }, QR_POLL_INTERVAL);
  }

  /** 二维码登录成功后，拉取最新登录态并写入 */
  private async onQrLoginSuccess() {
    try {
      const status = await UserService.loginStatus();
      if (status?.code === 200 && status?.data?.profile) {
        message.success('登录成功');
        this.onLoginSuccess(status.data.profile);
      } else {
        this._qrTip.value = '登录失败，请重试';
        this.startQrLogin();
      }
    } catch {
      this._qrTip.value = '登录失败，请重试';
      this.startQrLogin();
    }
  }

  /** 停止轮询 */
  stopQr() {
    if (this._qrPolling) {
      clearInterval(this._qrPolling);
      this._qrPolling = null;
    }
  }

  /** 用户主动刷新二维码 */
  refreshQr() {
    this.startQrLogin();
  }
  //#endregion
}

export default new LoginService();
