import { Common_IUserVO } from '../../../services/common-api/user-api';

export interface PD_IPlaylistDetail {
  backgroundCoverUrl: string;
  bannedTrackIds: string;
  cloudTrackCount: string;
  commentCount: string;
  commentThreadId: string;
  copied: boolean;
  coverImgId: string;
  coverImgId_str: string;
  coverImgUrl: string;
  createTime: string;
  description: string;
  englishTitle: string;
  gradeStatus: string;
  highQuality: boolean;
  historySharedUsers: string;
  id: string;
  name: string;
  newImported: string;
  officialPlaylistType: string;
  opRecommend: string;
  ordered: string;
  playCount: string;
  privacy: string;
  remixVideo: string;
  score: string;
  shareCount: string;
  creator?: Common_IUserVO;
  tags: string[];
  titleImage: string;
  titleImageUrl: string;
  trackCount: string;
}
