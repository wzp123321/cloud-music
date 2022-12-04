import { Common_IUserVO } from '@/services/common-api/user-api';

// 歌手详情
export interface ArtistVO {
  artist: {
    topicPerson: number;
    alias: string[];
    picId: number;
    briefDesc: string;
    picUrl: string;
    img1v1Url: string;
    name: string;
    id: number;
    publishTime: number;
    mvSize: number;
  };
  hotSongs: AD_IMusicVO[];
}

export interface AD_IMusicVO {
  name: string;
  id: number;
  ar: {
    id: number[];
    name: string;
    tns: string[];
    alias: string[];
  }[];
  alia: string[];
  al: {
    id: number;
    name: string;
    picUrl: string;
    pic_str: string;
    pic: number;
  };
  dt: number;
  copyright: number;
  mark: number;
  publishTime: number;
}

export interface AlbumRes {
  artist: ArtistVO;
  code: number;
  hotAlbums: AlbumVO[];
}

/**
 * 专辑
 */
export interface AlbumVO {
  alias: string[];
  artist: ArtistVO;
  blurPicUrl: string;
  briefDesc: string;
  commentThreadId: string;
  company: string;
  companyId: number;
  copyrightId: number;
  description: string;
  id: number;
  mark: number;
  name: string;
  pic: number;
  picId: number;
  picId_str: string;
  picUrl: string;
  publishTime: number;
  size: number;
  status: number;
  subType: string;
  tags: string;
  type: string;
}

// mv响应
export interface MVRes {
  code: number;
  mvs: MvVO[];
}

// mv
export interface MvVO {
  artist: ArtistVO;
  artistName: string;
  duration: number;
  id: number;
  imgurl: string;
  cover?: string;
  name: string;
  playCount: number;
  publishTime: string;
  status: number;
}

// 描述响应
export interface DescRes {
  briefDesc: string;
  code: number;
  count: number;
  introduction: {
    ti: string;
    txt: string;
  }[];
  topicData: {
    addTime: number;
    categoryId: number;
    categoryName: string;
    commentCount: number;
    commentThreadId: string;
    coverUrl: string;
    creator: Common_IUserVO;
    id: number;
    liked: false;
    likedCount: number;
    mainTitle: string;
    memo: string;
    number: number;
    readCount: number;
    recmdContent: string;
    recmdTitle: string;
    rectanglePicUrl: string;
    relatedResource: string;
    reward: false;
    rewardCount: number;
    rewardMoney: number;
    seriesId: number;
    shareContent: string;
    shareCount: number;
    showComment: true;
    showRelated: true;
    summary: string;
    tags: string[];
    title: string;
    topic: {
      adInfo: string;
      addTime: number;
      auditStatus: number;
      auditTime: number;
      auditor: string;
      categoryId: number;
      content: {
        content: string;
        id: number;
        type: number;
      }[];
      cover: number;
      delReason: string;
      fromBackend: false;
      headPic: number;
      hotScore: number;
      id: number;
      mainTitle: string;
      memo: string;
      number: number;
      pubImmidiatly: true;
      pubTime: number;
      readCount: number;
      recomdContent: '';
      recomdTitle: '';
      rectanglePic: number;
      reward: false;
      seriesId: number;
      shareContent: string;
      showComment: true;
      showRelated: true;
      startText: string;
      status: number;
      summary: string;
      tags: string[];
      title: string;
      updateTime: number[];
      userId: number;
      wxTitle: string;
    };
    url: string;
    wxTitle: string;
  }[];
}
