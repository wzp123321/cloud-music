import { useSingletonStore } from "@/store/singletons";
 
import { ref } from 'vue';

import { getQueryParam } from '@/core/token';
import { useUserStore } from '@/store/user';
import UserService from '@/apis/user/user.service';
import {
  UC_UserDetail,
  UC_Playlist,
  UC_UserLevel,
  UC_UserSubcount,
  UC_Record,
  UC_Event,
  UC_CloudItem,
  UC_FollowUser,
} from '@/apis/user/user.api';

const emptyDetail: UC_UserDetail = { profile: {} as any };

// 创建用户中心共享状态：响应式数据统一用 ref，行为统一为 const 箭头函数
const create = () => {
  // 当前查看的用户 uid
  const uidRef = ref<number>(0);

  //#region 可观察状态（$ 字段对外保持为 Ref，供组件 watch 订阅）
  const _userDetail = ref<UC_UserDetail>(emptyDetail);
  const _playlists = ref<UC_Playlist[]>([]);
  const _level = ref<UC_UserLevel>({ level: 0, progress: 0 });
  const _subcount = ref<UC_UserSubcount>({
    programCount: 0,
    djRadioCount: 0,
    mvCount: 0,
    artistCount: 0,
    newProgramCount: 0,
    createDjRadioCount: 0,
    createdPlaylistCount: 0,
    subPlaylistCount: 0,
  });
  const _record = ref<UC_Record>({ allData: [], weekData: [] });
  const _event = ref<UC_Event[]>([]);
  const _cloud = ref<{ list: UC_CloudItem[]; count: number }>({ list: [], count: 0 });
  const _follows = ref<UC_FollowUser[]>([]);
  const _followeds = ref<UC_FollowUser[]>([]);
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
    const qid = getQueryParam('uid');
    if (qid) {
      uidRef.value = Number(qid);
    } else {
      uidRef.value = useUserStore().profile?.userId ?? 0;
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
    get followsValue(): UC_FollowUser[] {
      return _follows.value;
    },
    get followedsValue(): UC_FollowUser[] {
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

export const useUserCenter = () => useSingletonStore().get("useUserCenter", create);
