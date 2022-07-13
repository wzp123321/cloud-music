// 歌手详情
export interface ArtistVO {
  artist: {
    img1v1Id: number;
    topicPerson: number;
    followed: false;
    alias: string[];
    picId: number;
    briefDesc: string;
    musicSize: number;
    albumSize: number;
    picUrl: string;
    img1v1Url: string;
    trans: string;
    name: string;
    id: number;
    publishTime: number;
    picId_str: string;
    img1v1Id_str: string;
    mvSize: number;
  };
  hotSongs: {
    rtUrls: string[];
    ar: { id: number; name: string; alia: string[] }[];
    al: {
      id: number;
      name: string;
      picUrl: string;
      pic_str: string;
      pic: number;
      alia: string[];
    };
    st: number;
    rtype: number;
    pst: number;
    alia: string[];
    mv: number;
    dt: number;
    name: string;
    id: number;
    privilege: {
      id: number;
      fee: number;
      payed: number;
      st: number;
      pl: number;
      dl: number;
      sp: number;
      cp: number;
      subp: number;
      maxbr: number;
      fl: number;
      flag: number;
    };
  }[];
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
export interface MvVO {}
