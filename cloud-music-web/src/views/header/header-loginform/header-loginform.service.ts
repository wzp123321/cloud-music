import { ref } from 'vue';
import { ELOGINTYPE, Header_ILoginVO } from './header-loginform.api';

class LoginService {
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
}

export default new LoginService();
