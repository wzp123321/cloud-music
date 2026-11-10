 
import { Common_IUserVO } from '@/apis/common-api/user-api';

/**
 * 用户中心与登录增强接口路由枚举
 * 规则：server 端文件名下划线转斜杠（如 login_qr_key -> /login/qr/key），
 * BASE_URL(/api/) 由 request.ts 统一拼接，这里只写相对路径。
 */
export enum EUserPath {
  // 用户资料与资产
  用户详情 = '/user/detail',
  用户歌单 = '/user/playlist',
  用户等级 = '/user/level',
  用户订阅数 = '/user/subcount',
  听歌排行 = '/user/record',
  用户动态 = '/user/event',
  云盘 = '/user/cloud',

  // 关注关系
  关注列表 = '/user/follows',
  粉丝列表 = '/user/followeds',
  关注或取消关注 = '/follow',

  // 资料编辑
  更新资料 = '/user/update',
  用户绑定 = '/user/binding',
  绑定手机 = '/user/bindingcellphone',
  上传头像 = '/avatar/upload',

  // 二维码登录
  二维码Key = '/login/qr/key',
  二维码创建 = '/login/qr/create',
  二维码检查 = '/login/qr/check',

  // 登录状态保持
  登录刷新 = '/login/refresh',
  登录状态 = '/login/status',
}

/** 歌单（用户歌单列表项） */
export interface UC_IPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
  subscribed: boolean;
  userId: number;
  creator?: Common_IUserVO;
  description?: string;
  [key: string]: unknown;
}

/** 用户详情 */
export interface UC_IUserDetail {
  level?: number;
  listenSongs?: number;
  profile: Common_IUserVO;
  createTime?: number;
  [key: string]: unknown;
}

/** 用户等级 */
export interface UC_IUserLevel {
  level: number;
  progress: number;
  nextPlayCount?: number;
  nowPlayCount?: number;
  nextLoginCount?: number;
  nowLoginCount?: number;
  [key: string]: unknown;
}

/** 用户订阅数 */
export interface UC_IUserSubcount {
  programCount: number;
  djRadioCount: number;
  mvCount: number;
  artistCount: number;
  newProgramCount: number;
  createDjRadioCount: number;
  createdPlaylistCount: number;
  subPlaylistCount: number;
  [key: string]: unknown;
}

/** 听歌排行里的歌曲（兼容 al/album、ar/artists 两种上游结构） */
export interface UC_ISongBrief {
  id?: number;
  name?: string;
  al?: { name?: string; picUrl?: string };
  album?: { name?: string; picUrl?: string };
  ar?: { name?: string }[];
  artists?: { name?: string }[];
}

/** 听歌排行项 */
export interface UC_IRecordItem {
  playCount: number;
  score: number;
  song: UC_ISongBrief;
  [key: string]: unknown;
}

/** 听歌排行（type: 0 全部 / 1 最近一周） */
export interface UC_IRecord {
  allData: UC_IRecordItem[];
  weekData: UC_IRecordItem[];
  [key: string]: unknown;
}

/** 用户动态 */
export interface UC_IEvent {
  id: string;
  type: string;
  user: Common_IUserVO;
  msg: string;
  /** 动态时间戳（毫秒） */
  eventTime?: number;
  [key: string]: unknown;
}

/** 云盘文件 */
export interface UC_ICloudItem {
  songId: number;
  songName: string;
  artist: string;
  album: string;
  addTime: number;
  fileSize: number;
  [key: string]: unknown;
}

/** 关注 / 粉丝 用户（精简） */
export interface UC_IFollowUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature: string;
  followed: boolean;
  gender: number;
  [key: string]: unknown;
}

/** 二维码 key 返回 */
export interface UC_IQrKey {
  unikey: string;
  [key: string]: unknown;
}

/** 二维码创建返回 */
export interface UC_IQrCreate {
  qrurl: string;
  qrimg: string;
}

/** 二维码检查返回：code 800 过期 / 801 等待扫码 / 802 待确认 / 803 成功 */
export interface UC_IQrCheck {
  code: number;
  message: string;
  nickname?: string;
  avatarUrl?: string;
  cookie?: string;
  [key: string]: unknown;
}

/** 登录状态返回 */
export interface UC_ILoginStatus {
  code: number;
  data?: {
    profile?: Common_IUserVO;
    [key: string]: unknown;
  };
  account?: unknown;
  [key: string]: unknown;
}

/** 资料更新入参 */
export interface UC_IUpdateProfile {
  nickname?: string;
  signature?: string;
  gender?: number;
  birthday?: number;
  province?: number;
  city?: number;
}

/** 绑定手机入参 */
export interface UC_IBindingCellphone {
  phone: string;
  captcha: string;
  countrycode?: string;
  password?: string;
}

/** 绑定手机返回 */
export interface UC_IBindingCellphoneRes {
  code: number;
  [key: string]: unknown;
}

/** 上传头像入参（FormData 文件上传，字段名 imgFile） */
export interface UC_IAvatarUpload {
  imgFile: File;
}

/** 上传头像返回 */
export interface UC_IAvatarUploadRes {
  code: number;
  data?: {
    url?: string;
    url_pre?: string;
    imgId?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
