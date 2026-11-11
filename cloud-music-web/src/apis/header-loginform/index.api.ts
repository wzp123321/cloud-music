export enum ELOGINTYPE {
  邮箱 = 'email',
  手机 = 'phone',
  二维码 = 'qr',
}

/** 二维码轮询状态 */
export enum EQRSTATUS {
  过期 = 800, // 二维码过期，需刷新
  等待扫码 = 801, // 等待扫码
  待确认 = 802, // 已扫码，等待确认
  成功 = 803, // 授权登录成功
}

export interface Header_ILoginVO {
  username: string;
  password: string;
}

export interface HL_ILoginUserVO {
  profile?: {
    backgroundUrl: string;
    vipType: number;
    authStatus: number;
    djStatus: number;
    detailDescription: string;
    accountStatus: number;
    nickname: string;
    birthday: number;
    gender: number;
    province: number;
    city: number;
    avatarUrl: string;
    userType: number;
    defaultAvatar: boolean;
    description: string;
    userId: number;
    authority: number;
    followeds: number;
    follows: string;
    eventCount: string;
    playlistCount: number;
    playlistBeSubscribedCount: number;
  };
}
