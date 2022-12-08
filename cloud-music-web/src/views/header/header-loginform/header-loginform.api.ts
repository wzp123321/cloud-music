export enum ELOGINTYPE {
  邮箱 = 'email',
  手机 = 'phone',
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
