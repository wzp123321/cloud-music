export interface AlbumRes {
  code: number;
  resourceState: boolean;
  songs: AlbumSongVO[];
  album: AlbumVO;
}

/** 专辑作曲/演唱者：接口返回的是扁平对象，不是歌手详情结构 */
export interface AlbumArtistVO {
  id: number;
  name: string;
  picUrl: string;
  img1v1Url?: string;
  alias?: string[];
}

/** 专辑内单曲：接口原始结构（保留 al / ar 嵌套，供列表渲染与播放使用） */
export interface AlbumSongVO {
  id: number;
  name: string;
  dt: number;
  al: {
    id: number;
    name: string;
    picUrl: string;
  };
  ar: {
    id: number;
    name: string;
  }[];
}

export interface AlbumVO {
  paid: boolean;
  onSale: boolean;
  mark: number;
  companyId: number;
  blurPicUrl: string;
  commentThreadId: string;
  artists: AlbumArtistVO[];
  alias: string[];
  copyrightId: number;
  picId: number;
  artist: AlbumArtistVO;
  pic: number;
  picUrl: string;
  publishTime: number;
  company: string;
  description: string;
  status: number;
  name: string;
  id: number;
  type: string;
  picId_str: string;
  info: {
    commentThread: {
      id: string;
      resourceInfo: {
        id: number;
        name: string;
        imgUrl: string;
      };
      resourceType: number;
      commentCount: number;
      likedCount: number;
      shareCount: number;
      hotCount: number;
      resourceTitle: string;
      resourceId: number;
    };
    liked: boolean;
    resourceType: number;
    resourceId: number;
    commentCount: number;
    likedCount: number;
    shareCount: number;
  };
}
