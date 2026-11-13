import { getRequest, postRequest, postFormRequest, unwrapData } from '../request';
import {
  EUserPath,
  UC_UserDetail,
  UC_Playlist,
  UC_UserLevel,
  UC_UserSubcount,
  UC_Record,
  UC_Event,
  UC_CloudItem,
  UC_FollowUser,
  UC_QrKey,
  UC_QrCreate,
  UC_QrCheck,
  UC_LoginStatus,
  UC_UpdateProfile,
  UC_BindingCellphone,
  UC_BindingCellphoneRes,
  UC_AvatarUpload,
  UC_AvatarUploadRes,
} from './user.api';

/**
 * 用户中心与登录增强接口封装
 * 统一走 request.ts 的 getRequest / postRequest / postFormRequest；
 * 返回类型由泛型显式声明，避免 `as` 强转散落各处；包裹层解包统一用 unwrapData。
 */
class UserService {
  //#region 用户资料与资产
  /** 用户详情 */
  public async getUserDetail(uid: number) {
    return getRequest<UC_UserDetail>(EUserPath.用户详情, { uid });
  }

  /** 我的歌单 */
  public async getUserPlaylists(uid: number, limit = 30, offset = 0) {
    const res = await getRequest<{ playlist?: UC_Playlist[] }>(EUserPath.用户歌单, { uid, limit, offset });
    return res?.playlist ?? [];
  }

  /** 用户等级 */
  public async getUserLevel() {
    return unwrapData<UC_UserLevel>(await getRequest(EUserPath.用户等级));
  }

  /** 用户订阅数 */
  public async getUserSubcount() {
    return unwrapData<UC_UserSubcount>(await getRequest(EUserPath.用户订阅数));
  }

  /** 听歌排行 type: 0 全部，1 最近一周 */
  public async getUserRecord(uid: number, type = 1) {
    const res = await getRequest<UC_Record>(EUserPath.听歌排行, { uid, type });
    return (res ?? {}) as UC_Record;
  }

  /** 用户动态 */
  public async getUserEvent(uid: number, limit = 20, lasttime = -1) {
    const res = await getRequest<{ events: UC_Event[]; more: boolean }>(EUserPath.用户动态, {
      uid,
      limit,
      lasttime,
    });
    return (res ?? {}) as { events: UC_Event[]; more: boolean };
  }

  /** 云盘 */
  public async getUserCloud(limit = 30, offset = 0) {
    return unwrapData<{ list: UC_CloudItem[]; count: number }>(
      await getRequest(EUserPath.云盘, { limit, offset }),
    );
  }
  //#endregion

  //#region 关注关系
  /** 关注列表 */
  public async getUserFollows(uid: number, limit = 30, offset = 0) {
    const res = await getRequest<{ follow?: UC_FollowUser[] }>(EUserPath.关注列表, { uid, limit, offset });
    return res?.follow ?? [];
  }

  /** 粉丝列表 */
  public async getUserFolloweds(uid: number, limit = 30, offset = 0) {
    const res = await getRequest<{ followeds?: UC_FollowUser[] }>(EUserPath.粉丝列表, { uid, limit, offset });
    return res?.followeds ?? [];
  }

  /** 关注 / 取消关注  t=1 关注，t=0 取关 */
  public async follow(id: number, t: 1 | 0 = 1) {
    return postRequest(EUserPath.关注或取消关注, { id, t });
  }
  //#endregion

  //#region 资料编辑
  /** 更新用户资料 */
  public async updateUser(payload: UC_UpdateProfile) {
    return postRequest(EUserPath.更新资料, payload);
  }

  /** 用户绑定列表 */
  public async getUserBinding(uid = 0) {
    return unwrapData<{ bindings: unknown[] }>(await getRequest(EUserPath.用户绑定, { uid }));
  }

  /** 绑定手机号 POST /user/bindingcellphone */
  public async bindingCellphone(payload: UC_BindingCellphone) {
    const res = await postRequest<UC_BindingCellphoneRes>(EUserPath.绑定手机, payload);
    return (res ?? {}) as UC_BindingCellphoneRes;
  }

  /** 上传头像（FormData 文件上传）POST /avatar/upload */
  public async uploadAvatar(payload: UC_AvatarUpload) {
    const formData = new FormData();
    formData.append('imgFile', payload.imgFile);
    const res = await postFormRequest<UC_AvatarUploadRes>(EUserPath.上传头像, formData);
    return (res ?? {}) as UC_AvatarUploadRes;
  }
  //#endregion

  //#region 二维码登录
  /** 生成二维码 key */
  public async getQrKey() {
    return unwrapData<UC_QrKey>(await getRequest(EUserPath.二维码Key));
  }

  /** 生成二维码图片（qrimg 为 dataURL） */
  public async getQrCreate(key: string, qrimg = true) {
    return unwrapData<UC_QrCreate>(await getRequest(EUserPath.二维码创建, { key, qrimg }));
  }

  /** 轮询扫码状态 */
  public async checkQr(key: string) {
    const res = await getRequest<UC_QrCheck>(EUserPath.二维码检查, { key });
    return (res ?? {}) as UC_QrCheck;
  }
  //#endregion

  //#region 登录状态保持
  /** 刷新登录态 */
  public async loginRefresh() {
    return postRequest(EUserPath.登录刷新);
  }

  /** 查询当前登录状态 */
  public async loginStatus() {
    const res = await getRequest<UC_LoginStatus>(EUserPath.登录状态);
    return (res ?? {}) as UC_LoginStatus;
  }
  //#endregion
}

export default new UserService();
