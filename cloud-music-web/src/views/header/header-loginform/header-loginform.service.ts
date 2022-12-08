import { ref } from 'vue';
import { Observable, BehaviorSubject } from 'rxjs';

import { postRequest } from '@/services/request';
import { ELOGINTYPE, Header_ILoginVO, HL_ILoginUserVO } from './header-loginform.api';

enum EPath {
  手机号码登陆 = '/login/cellphone',
  邮箱登陆 = '/login',
}

import message from '@/utils/message';
import { FSetCookie } from '@/core/token';
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

  show() {
    this._type.value = ELOGINTYPE.邮箱;
    this._visible.value = true;
  }

  handleClose = () => {
    this._visible.value = false;
  };

  setTab(value: string) {
    if (this._type.value !== value) {
      this._type.value = value;
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
      console.log(res);
      if (res?.code !== 200) {
        message.error(res?.message);
      } else {
        message.success('登录成功');
        FSetCookie('cloud-token', res?.token);
        console.log({
          profile: res?.profile,
          cookie: res?.cookie,
        });
        FSetCookie(
          'cloud-userInfo',
          JSON.stringify({
            profile: {
              backgroundUrl: res?.profile?.backgroundUrl,
              vipType: res?.profile?.vipType,
              authStatus: res?.profile?.authStatus,
              djStatus: res?.profile?.djStatus,
              detailDescription: res?.profile?.detailDescription,
              accountStatus: res?.profile?.accountStatus,
              nickname: res?.profile?.nickname,
              birthday: res?.profile?.birthday,
              gender: res?.profile?.gender,
              province: res?.profile?.province,
              city: res?.profile?.city,
              avatarUrl: res?.profile?.avatarUrl,
              userType: res?.profile?.userType,
              defaultAvatar: res?.profile?.defaultAvatar,
              description: res?.profile?.description,
              userId: res?.profile?.userId,
              authority: res?.profile?.authority,
              followeds: res?.profile?.followeds,
              follows: res?.profile?.follows,
              eventCount: res?.profile?.eventCount,
              playlistCount: res?.profile?.playlistCount,
              playlistBeSubscribedCount: res?.profile?.playlistBeSubscribedCount,
            },
          }),
        );

        this._loginResult$.next({
          profile: {
            backgroundUrl: res?.profile?.backgroundUrl,
            vipType: res?.profile?.vipType,
            authStatus: res?.profile?.authStatus,
            djStatus: res?.profile?.djStatus,
            detailDescription: res?.profile?.detailDescription,
            accountStatus: res?.profile?.accountStatus,
            nickname: res?.profile?.nickname,
            birthday: res?.profile?.birthday,
            gender: res?.profile?.gender,
            province: res?.profile?.province,
            city: res?.profile?.city,
            avatarUrl: res?.profile?.avatarUrl,
            userType: res?.profile?.userType,
            defaultAvatar: res?.profile?.defaultAvatar,
            description: res?.profile?.description,
            userId: res?.profile?.userId,
            authority: res?.profile?.authority,
            followeds: res?.profile?.followeds,
            follows: res?.profile?.follows,
            eventCount: res?.profile?.eventCount,
            playlistCount: res?.profile?.playlistCount,
            playlistBeSubscribedCount: res?.profile?.playlistBeSubscribedCount,
          },
        });

        this._visible.value = false;
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
      console.log(res);
      if (res?.code !== 200) {
        message.error(res?.message);
      }
    } catch (error) {
      message.error('服务器异常');
    }
  }
}

export default new LoginService();
