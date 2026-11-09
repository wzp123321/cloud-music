/* eslint-disable */
import { getRequest, postRequest, postFormRequest } from './request';
import {
  EUserPath,
  UC_IUserDetail,
  UC_IPlaylist,
  UC_IUserLevel,
  UC_IUserSubcount,
  UC_IRecord,
  UC_IEvent,
  UC_ICloudItem,
  UC_IFollowUser,
  UC_IQrKey,
  UC_IQrCreate,
  UC_IQrCheck,
  UC_ILoginStatus,
  UC_IUpdateProfile,
  UC_IBindingCellphone,
  UC_IBindingCellphoneRes,
  UC_IAvatarUpload,
  UC_IAvatarUploadRes,
} from './user.api';

/**
 * 用户中心与登录增强接口封装
 * 统一走 request.ts 的 getRequest / postRequest
 */
class UserService {
  //#region 用户资料与资产
  /** 用户详情 */
  public async getUserDetail(uid: number) {
    const res = await getRequest(EUserPath.用户详情, { uid });
    return res as UC_IUserDetail;
  }

  /** 我的歌单 */
  public async getUserPlaylists(uid: number, limit = 30, offset = 0) {
    const res = await getRequest(EUserPath.用户歌单, { uid, limit, offset });
    return (res?.playlist ?? []) as UC_IPlaylist[];
  }

  /** 用户等级 */
  public async getUserLevel() {
    const res = await getRequest(EUserPath.用户等级);
    return (res?.data ?? res) as UC_IUserLevel;
  }

  /** 用户订阅数 */
  public async getUserSubcount() {
    const res = await getRequest(EUserPath.用户订阅数);
    return (res?.data ?? res) as UC_IUserSubcount;
  }

  /** 听歌排行 type: 0 全部，1 最近一周 */
  public async getUserRecord(uid: number, type = 1) {
    const res = await getRequest(EUserPath.听歌排行, { uid, type });
    return (res ?? {}) as UC_IRecord;
  }

  /** 用户动态 */
  public async getUserEvent(uid: number, limit = 20, lasttime = -1) {
    const res = await getRequest(EUserPath.用户动态, { uid, limit, lasttime });
    return (res ?? {}) as { events: UC_IEvent[]; more: boolean; [k: string]: any };
  }

  /** 云盘 */
  public async getUserCloud(limit = 30, offset = 0) {
    const res = await getRequest(EUserPath.云盘, { limit, offset });
    return (res?.data ?? res ?? {}) as { list: UC_ICloudItem[]; count: number; [k: string]: any };
  }
  //#endregion

  //#region 关注关系
  /** 关注列表 */
  public async getUserFollows(uid: number, limit = 30, offset = 0) {
    const res = await getRequest(EUserPath.关注列表, { uid, limit, offset });
    return (res?.follow ?? []) as UC_IFollowUser[];
  }

  /** 粉丝列表 */
  public async getUserFolloweds(uid: number, limit = 30, offset = 0) {
    const res = await getRequest(EUserPath.粉丝列表, { uid, limit, offset });
    return (res?.followeds ?? []) as UC_IFollowUser[];
  }

  /** 关注 / 取消关注  t=1 关注，t=0 取关 */
  public async follow(id: number, t: 1 | 0 = 1) {
    const res = await postRequest(EUserPath.关注或取消关注, { id, t });
    return res;
  }
  //#endregion

  //#region 资料编辑
  /** 更新用户资料 */
  public async updateUser(payload: UC_IUpdateProfile) {
    const res = await postRequest(EUserPath.更新资料, payload);
    return res;
  }

  /** 用户绑定列表 */
  public async getUserBinding(uid = 0) {
    const res = await getRequest(EUserPath.用户绑定, { uid });
    return (res?.data ?? res ?? {}) as { bindings: any[]; [k: string]: any };
  }

  /** 绑定手机号 POST /user/bindingcellphone */
  public async bindingCellphone(payload: UC_IBindingCellphone) {
    const res = await postRequest(EUserPath.绑定手机, payload);
    return (res ?? {}) as UC_IBindingCellphoneRes;
  }

  /** 上传头像（FormData 文件上传）POST /avatar/upload */
  public async uploadAvatar(payload: UC_IAvatarUpload) {
    const formData = new FormData();
    formData.append('imgFile', payload.imgFile);
    const res = await postFormRequest(EUserPath.上传头像, formData);
    return (res ?? {}) as UC_IAvatarUploadRes;
  }
  //#endregion

  //#region 二维码登录
  /** 生成二维码 key */
  public async getQrKey() {
    const res = await getRequest(EUserPath.二维码Key);
    return (res?.data ?? {}) as UC_IQrKey;
  }

  /** 生成二维码图片（qrimg 为 dataURL） */
  public async getQrCreate(key: string, qrimg = true) {
    const res = await getRequest(EUserPath.二维码创建, { key, qrimg });
    return (res?.data ?? {}) as UC_IQrCreate;
  }

  /** 轮询扫码状态 */
  public async checkQr(key: string) {
    const res = await getRequest(EUserPath.二维码检查, { key });
    return (res ?? {}) as UC_IQrCheck;
  }
  //#endregion

  //#region 登录状态保持
  /** 刷新登录态 */
  public async loginRefresh() {
    const res = await postRequest(EUserPath.登录刷新);
    return res;
  }

  /** 查询当前登录状态 */
  public async loginStatus() {
    const res = await getRequest(EUserPath.登录状态);
    return (res ?? {}) as UC_ILoginStatus;
  }
  //#endregion
}

export default new UserService();
