import { ref } from 'vue';

class LoginService {
  //#region
  private _visible = ref<boolean>(false);

  public get visible(): boolean {
    return this._visible.value;
  }
  //#endregion

  show() {
    this._visible.value = true;
  }

  handleClose = () => {
    this._visible.value = false;
  };
}

export default new LoginService();
