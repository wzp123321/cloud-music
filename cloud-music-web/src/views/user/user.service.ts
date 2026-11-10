 
import { ref } from 'vue';

import { FGetCookie, FGetQueryParam } from '@/core/token';
import UserService from '@/apis/user.service';
import {
  UC_IUserDetail,
  UC_IPlaylist,
  UC_IUserLevel,
  UC_IUserSubcount,
  UC_IRecord,
  UC_IEvent,
  UC_ICloudItem,
  UC_IFollowUser,
} from '@/apis/user.api';

const emptyDetail: UC_IUserDetail = { profile: {} as any };

// 创建用户中心共享状态：响应式数据统一用 ref，行为统一为 const 箭头函数
const create = () => {
  // 当前查看的用户 uid
  const uidRef = ref<number>(0);

  //#region 可观察状态（$ 字段对外保持为 Ref，供组件 watch 订阅）
  const _userDetail = ref<UC_IUserDetail>(emptyDetail);
  const _playlists = ref<UC_IPlaylist[]>([]);
  const _level = ref<UC_IUserLevel>({ level: 0, progress: 0 });
  const _subcount = ref<UC_IUserSubcount>({
    programCount: 0,
    djRadioCount: 0,
    mvCount: 0,
    artistCount: 0,
    newProgramCount: 0,
    createDjRadioCount: 0,
    createdPlaylistCount: 0,
    subPlaylistCount: 0,
  });
  const _record = ref<UC_IRecord>({ allData: [], weekData: [] });
  const _event = ref<UC_IEvent[]>([]);
  const _cloud = ref<{ list: UC_ICloudItem[]; count: number }>({ list: [], count: 0 });
  const _follows = ref<UC_IFollowUser[]>([]);
  const _followeds = ref<UC_IFollowUser[]>([]);
  //#endregion

  //#region 基础状态
  const _loading = ref<boolean>(true);
  const _recordType = ref<number>(1); // 0 全部 / 1 最近一周
  const _eventMore = ref<boolean>(false);
  const _followLoaded = ref<boolean>(false);
  //#endregion

  // 并行拉取资料/歌单/等级/统计/听歌排行，失败时保持空态由页面展示
  const loadAll = async () => {
    if (!uidRef.value) {
      _loading.value = false;
      return;
    }
    _loading.value = true;
    try {
      const [detail, playlists, level, subcount, record] = await Promise.all([
        UserService.getUserDetail(uidRef.value),
        UserService.getUserPlaylists(uidRef.value),
        UserService.getUserLevel(),
        UserService.getUserSubcount(),
        UserService.getUserRecord(uidRef.value, _recordType.value),
      ]);
      _userDetail.value = detail;
      _playlists.value = playlists;
      _level.value = level;
      _subcount.value = subcount;
      _record.value = record;
    } catch {
      // 接口失败时保持空态，由页面展示
    } finally {
      _loading.value = false;
    }
  };

  // 读取路由 uid，未指定时使用 cookie 中的当前登录用户，并触发全量加载
  const init = () => {
    const qid = FGetQueryParam('uid');
    if (qid) {
      uidRef.value = Number(qid);
    } else {
      const cookie = FGetCookie('cloud-userInfo');
      try {
        const profile = cookie ? JSON.parse(cookie)?.profile : undefined;
        uidRef.value = profile?.userId ?? 0;
      } catch {
        uidRef.value = 0;
      }
    }
    loadAll();
  };

  /** 切换听歌排行类型并重新加载 */
  const reloadRecord = async (type: number) => {
    _recordType.value = type;
    if (!uidRef.value) return;
    _record.value = await UserService.getUserRecord(uidRef.value, type);
  };

  /** 加载动态 */
  const loadEvent = async () => {
    if (!uidRef.value) return;
    try {
      const res = await UserService.getUserEvent(uidRef.value);
      _event.value = res.events ?? [];
      _eventMore.value = !!res.more;
    } catch {
      /* noop */
    }
  };

  /** 加载云盘 */
  const loadCloud = async () => {
    if (!uidRef.value) return;
    try {
      const res = await UserService.getUserCloud();
      _cloud.value = { list: res.list ?? [], count: res.count ?? 0 };
    } catch {
      /* noop */
    }
  };

  /** 加载关注列表 */
  const loadFollows = async () => {
    if (!uidRef.value) return;
    try {
      const list = await UserService.getUserFollows(uidRef.value);
      _follows.value = list;
      _followLoaded.value = true;
    } catch {
      /* noop */
    }
  };

  /** 加载粉丝列表 */
  const loadFolloweds = async () => {
    if (!uidRef.value) return;
    try {
      const list = await UserService.getUserFolloweds(uidRef.value);
      _followeds.value = list;
      _followLoaded.value = true;
    } catch {
      /* noop */
    }
  };

  /** 关注 / 取消关注后刷新列表 */
  const toggleFollow = async (userId: number, followed: boolean) => {
    try {
      await UserService.follow(userId, followed ? 0 : 1);
      await Promise.all([loadFollows(), loadFolloweds()]);
    } catch {
      /* noop */
    }
  };

  // 首次创建即初始化，等价于原 class 构造函数行为
  init();

  // 返回普通对象：值字段用 getter 包装为「值」，$ 字段直接放 Ref 不被解包
  const state = {
    get uid(): number {
      return uidRef.value;
    },
    set uid(value: number) {
      uidRef.value = value;
    },
    userDetail$: _userDetail,
    playlists$: _playlists,
    level$: _level,
    subcount$: _subcount,
    record$: _record,
    event$: _event,
    cloud$: _cloud,
    follows$: _follows,
    followeds$: _followeds,
    get loading(): boolean {
      return _loading.value;
    },
    get recordType(): number {
      return _recordType.value;
    },
    set recordType(value: number) {
      _recordType.value = value;
    },
    get eventMore(): boolean {
      return _eventMore.value;
    },
    get followLoaded(): boolean {
      return _followLoaded.value;
    },
    get followsValue(): UC_IFollowUser[] {
      return _follows.value;
    },
    get followedsValue(): UC_IFollowUser[] {
      return _followeds.value;
    },
    init,
    loadAll,
    reloadRecord,
    loadEvent,
    loadCloud,
    loadFollows,
    loadFolloweds,
    toggleFollow,
  };
  return state;
};

// 模块级缓存：保证跨组件共享同一实例
let shared: ReturnType<typeof create> | null = null;
export const useUserCenter = () => (shared ??= create());

