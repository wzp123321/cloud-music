import { CM_CommentVO } from '../../components/cm-comment/cm-comment.api';

export interface MP_MvDetail {
  artistId: number;
  artistName: string;
  artists: {
    followed: string;
    id: string;
    img1v1Url: string;
    name: string;
  };
  commentCount: string;
  commentThreadId: string;
  cover: string;
  coverId: string;
  coverId_str: string;
  desc: string;
  duration: string;
  id: string;
  nType: string;
  name: string;
  playCount: string;
  price: string;
  publishTime: string;
  shareCount: string;
  subCount: string;
}

export interface MP_MVCommentRes {
  comments: CM_CommentVO[];
  hotComments: CM_CommentVO[];
}
