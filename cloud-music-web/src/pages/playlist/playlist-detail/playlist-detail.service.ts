import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { FGetQueryParam } from '@/core/token';
import { AD_IMusicVO } from '../../artist/artist-detail/services/artist-detail-api';
import { PD_IPlaylistDetail } from './playlist-detail.api';
import { MP_IMVCommentRes } from '../../mvplay/mvplay.api';
import { Common_IMusic } from '../../../services/common-api/common-api';
import { getRequest } from '../../../services/request';
import CommonService from '../../../services/common.service';
import {
  subscribePlaylist,
  getPlaylistDetailDynamic,
  addTrackToPlaylist,
  deleteTrackFromPlaylist,
  getPlaylistTrackAll,
  PM_IDynamicRes,
} from '../../../services/playlist-manage.api';

enum EPath {
  查询歌单详情 = '/playlist/detail',
}

class PlayListDetailService {
  private playlistId = 0;

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

  private _playListMusicListResult$ = new BehaviorSubject<Common_IMusic[]>([]);

  private _dynamic$ = new BehaviorSubject<PM_IDynamicRes>({ code: 0 });

  private _subscribed = ref<boolean>(false);

  public get playListResult$() {
    return this._playListResult$ as unknown as Observable<PD_IPlaylistDetail>;
  }

  public get playListCommentResult$() {
    return this._playListCommentResult$ as unknown as Observable<MP_IMVCommentRes>;
  }

  public get playListMusicListResult$() {
    return this._playListMusicListResult$ as unknown as Observable<Common_IMusic[]>;
  }

  public get dynamic$() {
    return this._dynamic$ as unknown as Observable<PM_IDynamicRes>;
  }

  public get subscribed(): boolean {
    return this._subscribed.value;
  }

  public set subscribed(v: boolean) {
    this._subscribed.value = v;
  }
  //#region
  private _loading = ref<boolean>(true);

  public get loading(): boolean {
    return this._loading.value;
  }

  //#endregion

  constructor() {
    const id = FGetQueryParam('id');
    this.playlistId = id ? Number(id) : 0;
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

      this.refreshTracks();

      this.queryCommentList();
      this.queryDynamic();
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

  /**
   * 拉取歌单全部歌曲（playlist_track_all 直接返回歌曲详情）
   */
  async refreshTracks() {
    try {
      const res = await getPlaylistTrackAll({ id: this.playlistId, limit: 1000 });
      const songs = res?.songs || [];
      this._playListMusicListResult$.next(
        songs.map((item: any) => ({
          dt: item.dt,
          url: '',
          name: item.name,
          alName: item.al?.name,
          artist: item.ar?.[0]?.name,
          picUrl: item.al?.picUrl,
          id: item.id,
        })),
      );
    } catch (error) {
      // 失败回退到原逻辑
      try {
        const res = await getRequest(EPath.查询歌单详情, { id: this.playlistId });
        const ids = res?.playlist?.trackIds?.map((item: any) => item?.id)?.join(',');
        const commonService = new CommonService();
        const songRes = await commonService.getMusicDetailByIds(ids);
        this._playListMusicListResult$.next(
          (songRes?.songs || []).map((item: AD_IMusicVO) => ({
            dt: item.dt,
            url: '',
            name: item.name,
            alName: item.al?.name,
            artist: item.ar?.[0]?.name,
            picUrl: item.al.picUrl,
            id: item.id,
          })),
        );
      } catch (e) {}
    }
  }

  /**
   * 歌单动态数据（播放量/收藏数等）
   */
  async queryDynamic() {
    try {
      const res = await getPlaylistDetailDynamic({ id: this.playlistId });
      if (res) {
        this._dynamic$.next(res);
      }
    } catch (error) {}
  }

  /**
   * 收藏/取消收藏
   * @param t 1 收藏，2 取消
   */
  async subscribe(t: number) {
    const res = await subscribePlaylist({ id: this.playlistId, t });
    if (res?.code === 200) {
      this._subscribed.value = t === 1;
      this.queryDynamic();
    } else {
      throw new Error('操作失败');
    }
  }

  /**
   * 添加歌曲（ids 逗号分隔）
   */
  async addTrack(ids: string) {
    const res = await addTrackToPlaylist({ pid: this.playlistId, ids });
    if (res?.code === 200) {
      await this.refreshTracks();
      await this.queryDynamic();
    } else {
      throw new Error('添加失败');
    }
  }

  /**
   * 移除歌曲（ids 逗号分隔）
   */
  async removeTrack(ids: string) {
    const res = await deleteTrackFromPlaylist({ id: this.playlistId, ids });
    if (res?.code === 200) {
      await this.refreshTracks();
      await this.queryDynamic();
    } else {
      throw new Error('移除失败');
    }
  }
}

export default PlayListDetailService;
