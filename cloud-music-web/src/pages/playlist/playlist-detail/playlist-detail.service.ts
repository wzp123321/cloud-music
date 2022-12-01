import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { FGetQueryParam } from '@/core/token';
import { PD_IPlaylistDetail } from './playlist-detail.api';
import { getRequest } from '../../../services/request';

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
  });

  public get playListResult$() {
    return this._playListResult$ as unknown as Observable<PD_IPlaylistDetail>;
  }
  //#region
  private _loading = ref<boolean>(false);

  public get loading(): boolean {
    return this._loading.value;
  }

  //#endregion

  constructor() {
    this.init();
  }

  async init() {
    const id = FGetQueryParam('id');
    const res = await getRequest(EPath.查询歌单详情, {
      id,
    });
    this._playListResult$.next(res?.playlist);
  }
}

export default PlayListDetailService;
