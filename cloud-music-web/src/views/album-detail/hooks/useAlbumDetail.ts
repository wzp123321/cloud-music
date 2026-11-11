import { ref, reactive, type Ref } from 'vue';
import { FGetQueryParam } from '@/core/token';
import infoService from '../../../apis/album-detail/album-detail-service';

import { AlbumVO, AlbumSongVO } from '../../../apis/album-detail/album-detail-api';
import contentEnhanceService, { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { AlbumDetailDynamicRes, ContentAlbumItem } from '@/apis/content-enhance/index.api';

/*
 * @Descrption: 专辑详情服务
 */
// 专辑详情状态层：以 composable 形式组织，内部用 ref + const 箭头函数
const create = () => {
  //#region 状态
  const info = ref<AlbumVO>() as Ref<AlbumVO>; // 专辑详情：保持旧 getter 的返回类型 AlbumVO
  const songs = ref<AlbumSongVO[]>([]);
  const dynamic = ref<AlbumDetailDynamicRes>({});
  const subAlbums = ref<ContentAlbumItem[]>([]);
  const sublistNeedLogin = ref<boolean>(false);
  const subLoading = ref<boolean>(false);
  const actionTip = ref<string>('');
  const _id = ref(0); // 内部使用的专辑 id（原普通字段，非公开 getter，不暴露）
  //#endregion
  const query = async () => {
    try {
      const id = FGetQueryParam('id');
      _id.value = Number(id) || 0;
      const res = await infoService.getAlbumDetailById({ id: _id.value });
      if (res?.code === 200) {
        info.value = res?.album as AlbumVO;
        songs.value = res?.songs;
      } else {
        songs.value = [];
      }
    } catch {
      songs.value = [];
    }
    // 专辑动态与收藏列表与详情并行加载，参数 id 同源
    queryDynamic();
    querySublist();
  };

  /** 专辑动态信息：id ← /album_detail?id=，上游来自新碟列表 albums[].id */
  const queryDynamic = async () => {
    if (!_id.value) return;
    try {
      const res = await contentEnhanceService.getAlbumDetailDynamic({ id: _id.value });
      if (res?.code === 200) {
        dynamic.value = res;
      }
    } catch {
      dynamic.value = {};
    }
  };

  /** 已收藏专辑列表（需登录，未登录只做 UI 降级） */
  const querySublist = async () => {
    if (!hasLogin()) {
      sublistNeedLogin.value = true;
      return;
    }
    try {
      const res = await contentEnhanceService.getAlbumSublist({ limit: 12 });
      subAlbums.value = res?.data || [];
      sublistNeedLogin.value = false;
    } catch {
      subAlbums.value = [];
    }
  };

  /** 订阅/取消订阅专辑：t=1 订阅，t=0 取消；成功后刷新动态状态 */
  const toggleSub = async () => {
    if (!hasLogin()) {
      actionTip.value = '登录后可使用订阅功能';
      return;
    }
    if (!_id.value || subLoading.value) return;
    const t = dynamic.value.isSub ? 0 : 1;
    subLoading.value = true;
    actionTip.value = '';
    try {
      const res = await contentEnhanceService.setAlbumSub({ id: _id.value, t: t as 1 | 0 });
      if (res?.code === 200) {
        actionTip.value = t === 1 ? '已订阅该专辑' : '已取消订阅';
        await Promise.all([queryDynamic(), querySublist()]);
      } else {
        actionTip.value = res?.message || '操作未成功，请重试';
      }
    } catch {
      actionTip.value = '订阅失败，请检查登录态';
    } finally {
      subLoading.value = false;
    }
  };

  // reactive 包装：ref 自动解包，svc.xxx 仍是「值」，与旧 getter 行为一致
  const state = reactive({
    // 状态字段（对应原 public getter）
    info,
    songs,
    dynamic,
    subAlbums,
    sublistNeedLogin,
    subLoading,
    actionTip,
    // 方法（对应原 public 方法，签名不变）
    query,
    queryDynamic,
    querySublist,
    toggleSub,
  });
  return state;
};

/** 专辑详情页状态：每次调用创建新实例，保证切换专辑 id 后重新初始化 */
export const useAlbumDetail = () => create();
