import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { FGetQueryParam } from '@/core/token';
import { PD_IPlaylistDetail } from './playlist-detail.api';
import { MP_IMVCommentRes } from '../../mvplay/mvplay.api';
import { getRequest } from '../../../services/request';
import CommonService from '../../../services/common.service';

enum EPath {
  查询歌单详情 = '/playlist/detail',
}

class PlayListDetailService {
  //#region
  private _playListResult$ = new BehaviorSubject<PD_IPlaylistDetail>({
    backgroundCoverUrl: '',
    bannedTrackIds: '',
    cloudTrackCount: '',
    commentCount: '',
    commentThreadId: '',
    copied: false,
    coverImgId: '',
    coverImgId_str: '',
    coverImgUrl: '',
    createTime: '',
    description: '',
    englishTitle: '',
    gradeStatus: '',
    highQuality: false,
    historySharedUsers: '',
    id: '',
    name: '',
    newImported: '',
    officialPlaylistType: '',
    opRecommend: '',
    ordered: '',
    playCount: '',
    privacy: '',
    remixVideo: '',
    score: '',
    shareCount: '',
    tags: [],
    titleImage: '',
    titleImageUrl: '',
    trackCount: '',
    tracks: [],
  });

  private _playListCommentResult$ = new BehaviorSubject<MP_IMVCommentRes>({
    comments: [],
    hotComments: [],
  });

  public get playListResult$() {
    return this._playListResult$ as unknown as Observable<PD_IPlaylistDetail>;
  }

  public get playListCommentResult$() {
    return this._playListCommentResult$ as unknown as Observable<MP_IMVCommentRes>;
  }
  //#region
  private _loading = ref<boolean>(true);

  public get loading(): boolean {
    return this._loading.value;
  }

  //#endregion

  constructor() {
    this.init();
  }

  async init() {
    const id = FGetQueryParam('id');
    this._loading.value = true;
    try {
      const res = await getRequest(EPath.查询歌单详情, {
        id,
      });
      this._playListResult$.next(res?.playlist);

      this.queryCommentList();
    } catch (error) {
    } finally {
      this._loading.value = false;
    }
  }

  async queryCommentList() {
    const id = Number(FGetQueryParam('id'));
    const commonService = new CommonService();
    const res = await commonService.getPlayListCommentList(id);
    this._playListCommentResult$.next(res);
  }
}

export default PlayListDetailService;
