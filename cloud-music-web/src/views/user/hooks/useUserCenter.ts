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
  const uid = ref<number>(0);

  //#region 可观察状态（$ 字段对外保持为 Ref，供组件 watch 订阅）
  const userDetail = ref<UC_UserDetail>(emptyDetail);
  const playlists = ref<UC_Playlist[]>([]);
  const level = ref<UC_UserLevel>({ level: 0, progress: 0 });
  const subcount = ref<UC_UserSubcount>({
    programCount: 0,
    djRadioCount: 0,
    mvCount: 0,
    artistCount: 0,
    newProgramCount: 0,
    createDjRadioCount: 0,
    createdPlaylistCount: 0,
    subPlaylistCount: 0,
  });
  const record = ref<UC_Record>({ allData: [], weekData: [] });
  const event = ref<UC_Event[]>([]);
  const cloud = ref<{ list: UC_CloudItem[]; count: number }>({ list: [], count: 0 });
  const follows = ref<UC_FollowUser[]>([]);
  const followeds = ref<UC_FollowUser[]>([]);
  //#endregion

  //#region 基础状态
  const loading = ref<boolean>(true);
  const recordType = ref<number>(1); // 0 全部 / 1 最近一周
  const eventMore = ref<boolean>(false);
  const followLoaded = ref<boolean>(false);
  //#endregion

  // 并行拉取资料/歌单/等级/统计/听歌排行，失败时保持空态由页面展示
  const loadAll = async () => {
    if (!uid.value) {
      loading.value = false;
      return;
    }
    loading.value = true;
    try {
      const [detailRes, playlistsRes, levelRes, subcountRes, recordRes] = await Promise.all([
        UserService.getUserDetail(uid.value),
        UserService.getUserPlaylists(uid.value),
        UserService.getUserLevel(),
        UserService.getUserSubcount(),
        UserService.getUserRecord(uid.value, recordType.value),
      ]);
      userDetail.value = detailRes;
      playlists.value = playlistsRes;
      level.value = levelRes;
      subcount.value = subcountRes;
      record.value = recordRes;
    } catch {
      // 接口失败时保持空态，由页面展示
    } finally {
      loading.value = false;
    }
  };

  // 读取路由 uid，未指定时使用 cookie 中的当前登录用户，并触发全量加载
  const init = () => {
    const qid = getQueryParam('uid');
    if (qid) {
      uid.value = Number(qid);
    } else {
      uid.value = useUserStore().profile?.userId ?? 0;
    }
    loadAll();
  };

  /** 切换听歌排行类型并重新加载 */
  const reloadRecord = async (type: number) => {
    recordType.value = type;
    if (!uid.value) return;
    record.value = await UserService.getUserRecord(uid.value, type);
  };

  /** 加载动态 */
  const loadEvent = async () => {
    if (!uid.value) return;
    try {
      const res = await UserService.getUserEvent(uid.value);
      event.value = res.events ?? [];
      eventMore.value = !!res.more;
    } catch {
      /* noop */
    }
  };

  /** 加载云盘 */
  const loadCloud = async () => {
    if (!uid.value) return;
    try {
      const res = await UserService.getUserCloud();
      cloud.value = { list: res.list ?? [], count: res.count ?? 0 };
    } catch {
      /* noop */
    }
  };

  /** 加载关注列表 */
  const loadFollows = async () => {
    if (!uid.value) return;
    try {
      const list = await UserService.getUserFollows(uid.value);
      follows.value = list;
      followLoaded.value = true;
    } catch {
      /* noop */
    }
  };

  /** 加载粉丝列表 */
  const loadFolloweds = async () => {
    if (!uid.value) return;
    try {
      const list = await UserService.getUserFolloweds(uid.value);
      followeds.value = list;
      followLoaded.value = true;
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

  return {
    uid,
    userDetail$: userDetail,
    playlists$: playlists,
    level$: level,
    subcount$: subcount,
    record$: record,
    event$: event,
    cloud$: cloud,
    follows$: follows,
    followeds$: followeds,
    loading,
    recordType,
    eventMore,
    followLoaded,
    init,
    loadAll,
    reloadRecord,
    loadEvent,
    loadCloud,
    loadFollows,
    loadFolloweds,
    toggleFollow,
  };
};

export const useUserCenter = () => useSingletonStore().get("useUserCenter", create);
