import { onMounted, ref, watch } from 'vue';

import { getQueryParam } from '@/core/token';
import { useMvPlayer } from './useMvPlayer';
import { MP_MvDetail, MP_MVCommentRes } from '../../../apis/mvplay/index.api';
import contentEnhanceService, { hasLogin } from '@/apis/content-enhance/content-enhance.service';
import { MvDetailInfoRes } from '@/apis/content-enhance/index.api';
import { useRequest } from '@/hooks/useRequest';

export const useMvplayView = () => {
  const mvPlayer = useMvPlayer();
  // 互动数据请求统一走 useRequest（箭头体内延迟引用 loadMvStat，无 TDZ 问题）
  const { run: runMvStat } = useRequest(() => loadMvStat());

  /** 参数来源：mvid ← MV 列表 data[].id 或 /mvplay?mvid= */
  const mvid = Number(getQueryParam('mvid') || 0);
  const mvStat = ref<MvDetailInfoRes>({});
  const isSubed = ref<boolean>(false);
  const subLoading = ref<boolean>(false);
  const subTip = ref<string>('');

  const mvDetail = ref<MP_MvDetail>({
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
  const url = ref<string>('');
  const commentRes = ref<MP_MVCommentRes>({
    comments: [],
    hotComments: [],
  });

  /** MV 互动数据：mv_detail_info */
  const loadMvStat = async () => {
    if (!mvid) return;
    try {
      const res = await contentEnhanceService.getMvDetailInfo({ mvid });
      if (res?.code === 200) mvStat.value = res;
    } catch {
      mvStat.value = {};
    }
  };

  /** 收藏状态：mv_sublist（需登录，未登录时不请求） */
  const loadSubState = async () => {
    if (!mvid || !hasLogin()) return;
    try {
      const res = await contentEnhanceService.getMvSublist({ limit: 100 });
      isSubed.value = (res?.data || []).some((item: any) => Number(item.id || item.mvid) === mvid);
    } catch {
      isSubed.value = false;
    }
  };

  /** 收藏/取消收藏 MV：mv_sub（需登录，成功后刷新收藏状态） */
  const toggleMvSub = async () => {
    if (!hasLogin()) {
      subTip.value = '登录后可收藏 MV';
      return;
    }
    if (!mvid || subLoading.value) return;
    subLoading.value = true;
    subTip.value = '';
    const t = isSubed.value ? 0 : 1;
    try {
      const res = await contentEnhanceService.setMvSub({ mvid, t: t as 1 | 0 });
      if (res?.code === 200) {
        isSubed.value = t === 1;
        subTip.value = t === 1 ? '已收藏该 MV' : '已取消收藏';
        await loadSubState();
      } else {
        subTip.value = res?.message || '操作未成功，请重试';
      }
    } catch {
      subTip.value = '收藏失败，请检查登录态';
    } finally {
      subLoading.value = false;
    }
  };

  // 订阅 MV 详情 / 地址 / 评论状态，immediate 保证首屏同步到当前值
  watch(mvPlayer.mvDetailResult$, (v) => (mvDetail.value = v), { immediate: true });
  watch(mvPlayer.mvUrlResult$, (v) => (url.value = v), { immediate: true });
  watch(mvPlayer.mvCommentResult$, (v) => (commentRes.value = v), { immediate: true });

  onMounted(() => {
    runMvStat();
    loadSubState();
  });

  return {
    mvPlayer,
    url,
    mvDetail,
    mvStat,
    isSubed,
    subLoading,
    subTip,
    commentRes,
    toggleMvSub,
  };
}
