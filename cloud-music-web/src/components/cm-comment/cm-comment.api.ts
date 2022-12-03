import { Common_IUserVO } from '../../services/common-api/user-api';

/**
 * 评论
 */
export interface CM_ICommentVO {
  beReplied: CM_ICommentVO[];
  commentId: number;
  commentLocationType: number;
  content: string;
  liked: boolean;
  likedCount: number;
  needDisplayTime: boolean;
  parentCommentId: number;
  repliedMark: string;
  richContent: string;
  showFloorComment: string;
  status: number;
  time: number;
  timeStr: string;
  ipLocation: {
    ip: string;
    location: string;
    userId: string;
  };
  pendantData: CM_ICommentVO;
  user: Common_IUserVO;
}
