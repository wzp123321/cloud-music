/* eslint-disable */
import { ref } from 'vue';
import { BehaviorSubject, Observable } from 'rxjs';

import { FGetCookie, FGetQueryParam } from '@/core/token';
import UserService from '@/services/user.service';
import {
  UC_IUserDetail,
  UC_IPlaylist,
  UC_IUserLevel,
  UC_IUserSubcount,
  UC_IRecord,
  UC_IEvent,
  UC_ICloudItem,
  UC_IFollowUser,
} from '@/services/user.api';

const emptyDetail: UC_IUserDetail = { profile: {} as any };

class UserCenterService {
  public uid = 0;

  //#region 可观察状态
  private _userDetail$ = new BehaviorSubject<UC_IUserDetail>(emptyDetail);
  private _playlists$ = new BehaviorSubject<UC_IPlaylist[]>([]);
  private _level$ = new BehaviorSubject<UC_IUserLevel>({
    level: 0,
    progress: 0,
  });
  private _subcount$ = new BehaviorSubject<UC_IUserSubcount>({
    programCount: 0,
    djRadioCount: 0,
    mvCount: 0,
    artistCount: 0,
    newProgramCount: 0,
    createDjRadioCount: 0,
    createdPlaylistCount: 0,
    subPlaylistCount: 0,
  });
  private _record$ = new BehaviorSubject<UC_IRecord>({ allData: [], weekData: [] });
  private _event$ = new BehaviorSubject<UC_IEvent[]>([]);
  private _cloud$ = new BehaviorSubject<{ list: UC_ICloudItem[]; count: number }>({
    list: [],
    count: 0,
  });
  private _follows$ = new BehaviorSubject<UC_IFollowUser[]>([]);
  private _followeds$ = new BehaviorSubject<UC_IFollowUser[]>([]);

  public get userDetail$() {
    return this._userDetail$ as unknown as Observable<UC_IUserDetail>;
  }
  public get playlists$() {
    return this._playlists$ as unknown as Observable<UC_IPlaylist[]>;
  }
  public get level$() {
    return this._level$ as unknown as Observable<UC_IUserLevel>;
  }
  public get subcount$() {
    return this._subcount$ as unknown as Observable<UC_IUserSubcount>;
  }
  public get record$() {
    return this._record$ as unknown as Observable<UC_IRecord>;
  }
  public get event$() {
    return this._event$ as unknown as Observable<UC_IEvent[]>;
  }
  public get cloud$() {
    return this._cloud$ as unknown as Observable<{ list: UC_ICloudItem[]; count: number }>;
  }
  public get follows$() {
    return this._follows$ as unknown as Observable<UC_IFollowUser[]>;
  }
  public get followeds$() {
    return this._followeds$ as unknown as Observable<UC_IFollowUser[]>;
  }
  //#endregion

  //#region 基础状态
  private _loading = ref<boolean>(true);
  private _recordType = ref<number>(1); // 0 全部 / 1 最近一周
  private _eventMore = ref<boolean>(false);
  private _followLoaded = ref<boolean>(false);

  public get loading(): boolean {
    return this._loading.value;
  }
  public get recordType(): number {
    return this._recordType.value;
  }
  public set recordType(value: number) {
    this._recordType.value = value;
  }
  public get eventMore(): boolean {
    return this._eventMore.value;
  }
  public get followLoaded(): boolean {
    return this._followLoaded.value;
  }
  public get followsValue(): UC_IFollowUser[] {
    return this._follows$.value;
  }
  public get followedsValue(): UC_IFollowUser[] {
    return this._followeds$.value;
  }
  //#endregion

  constructor() {
    this.init();
  }

  init() {
    const qid = FGetQueryParam('uid');
    if (qid) {
      this.uid = Number(qid);
    } else {
      // 未指定 uid 时，使用当前登录用户
      const cookie = FGetCookie('cloud-userInfo');
      try {
        const profile = cookie ? JSON.parse(cookie)?.profile : undefined;
        this.uid = profile?.userId ?? 0;
      } catch {
        this.uid = 0;
      }
    }
    this.loadAll();
  }

  async loadAll() {
    if (!this.uid) {
      this._loading.value = false;
      return;
    }
    this._loading.value = true;
    try {
      const [detail, playlists, level, subcount, record] = await Promise.all([
        UserService.getUserDetail(this.uid),
        UserService.getUserPlaylists(this.uid),
        UserService.getUserLevel(),
        UserService.getUserSubcount(),
        UserService.getUserRecord(this.uid, this._recordType.value),
      ]);
      this._userDetail$.next(detail);
      this._playlists$.next(playlists);
      this._level$.next(level);
      this._subcount$.next(subcount);
      this._record$.next(record);
    } catch (error) {
      // 接口失败时保持空态，由页面展示
    } finally {
      this._loading.value = false;
    }
  }

  /** 切换听歌排行类型并重新加载 */
  async reloadRecord(type: number) {
    this._recordType.value = type;
    if (!this.uid) return;
    this._record$.next(await UserService.getUserRecord(this.uid, type));
  }

  /** 加载动态 */
  async loadEvent() {
    if (!this.uid) return;
    try {
      const res = await UserService.getUserEvent(this.uid);
      this._event$.next(res.events ?? []);
      this._eventMore.value = !!res.more;
    } catch {
      /* noop */
    }
  }

  /** 加载云盘 */
  async loadCloud() {
    if (!this.uid) return;
    try {
      const res = await UserService.getUserCloud();
      this._cloud$.next({ list: res.list ?? [], count: res.count ?? 0 });
    } catch {
      /* noop */
    }
  }

  /** 加载关注列表 */
  async loadFollows() {
    if (!this.uid) return;
    try {
      const list = await UserService.getUserFollows(this.uid);
      this._follows$.next(list);
      this._followLoaded.value = true;
    } catch {
      /* noop */
    }
  }

  /** 加载粉丝列表 */
  async loadFolloweds() {
    if (!this.uid) return;
    try {
      const list = await UserService.getUserFolloweds(this.uid);
      this._followeds$.next(list);
      this._followLoaded.value = true;
    } catch {
      /* noop */
    }
  }

  /** 关注 / 取消关注后刷新列表 */
  async toggleFollow(userId: number, followed: boolean) {
    try {
      await UserService.follow(userId, followed ? 0 : 1);
      await Promise.all([this.loadFollows(), this.loadFolloweds()]);
    } catch {
      /* noop */
    }
  }
}

const userCenterService = new UserCenterService();
export default userCenterService;
