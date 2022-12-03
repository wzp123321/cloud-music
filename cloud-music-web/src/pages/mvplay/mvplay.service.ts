import { FGetQueryParam } from '@/core/token';
import { BehaviorSubject, Observable } from 'rxjs';
import { ref } from 'vue';

import CommonService from '../../services/common.service';
import { MP_IMvDetail, MP_IMVCommentRes } from './mvplay.api';

class MvPlayerService {
  //#region
  private _mvDetailResult$ = new BehaviorSubject<MP_IMvDetail>({
    artistId: 0,
    artistName: '',
    artists: {
      followed: '',
      id: '',
      img1v1Url: '',
      name: '',
    },
    commentCount: '',
    commentThreadId: '',
    cover: '',
    coverId: '',
    coverId_str: '',
    desc: '',
    duration: '',
    id: '',
    nType: '',
    name: '',
    playCount: '',
    price: '',
    publishTime: '',
    shareCount: '',
    subCount: '',
  });

  private _mvUrlResult$ = new BehaviorSubject<string>('');

  private _mvCommentResult$ = new BehaviorSubject<MP_IMVCommentRes>({
    comments: [],
    hotComments: [],
  });

  public get mvDetailResult$() {
    return this._mvDetailResult$ as unknown as Observable<MP_IMvDetail>;
  }

  public get mvUrlResult$() {
    return this._mvUrlResult$ as unknown as Observable<string>;
  }

  public get mvCommentResult$() {
    return this._mvCommentResult$ as unknown as Observable<MP_IMVCommentRes>;
  }
  //#region
  private _mvid = 0;

  private _loading = ref<boolean>(false);

  public get loading(): boolean {
    return this._loading.value;
  }

  //#endregion

  constructor() {
    this._mvid = Number(FGetQueryParam('mvid'));
    this._loading.value = true;
    const commonService = new CommonService();
    commonService
      .getMvDetailById(this._mvid)
      .then((res) => {
        this._mvDetailResult$.next(res as MP_IMvDetail);
      })
      .catch(() => {
        this._loading.value = false;
      });
    this.queryUrl();
    this.queryCommentList();
  }

  async queryUrl() {
    try {
      const commonService = new CommonService();
      const res = await commonService.getMvUrlById(this._mvid);
      this._mvUrlResult$.next(res?.url);
    } catch (error) {
      this._loading.value = false;
    } finally {
      this._loading.value = false;
    }
  }

  async queryCommentList() {
    try {
      const commonService = new CommonService();
      const res = await commonService.getMvCommentList(this._mvid);
      console.log(res);
      this._mvCommentResult$.next(res);
    } catch (error) {
      this._loading.value = false;
    } finally {
      this._loading.value = false;
    }
  }
}

export default MvPlayerService;
