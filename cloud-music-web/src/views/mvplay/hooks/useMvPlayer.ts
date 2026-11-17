import { getQueryParam } from '@/core/token';
import { ref } from 'vue';

import CommonService from '../../../apis/common/common.service';
import { MP_MvDetail, MP_MVCommentRes } from '../../../apis/mvplay/index.api';

const create = () => {
  //#region
  const mvDetailResult$ = ref<MP_MvDetail>({
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

  const mvUrlResult$ = ref<string>('');

  const mvCommentResult$ = ref<MP_MVCommentRes>({
    comments: [],
    hotComments: [],
  });

  const loading = ref<boolean>(false);
  const mvid = Number(getQueryParam('mvid'));
  //#endregion

  const queryUrl = async () => {
    try {
      const commonService = new CommonService();
      const res = await commonService.getMvUrlById(mvid);
      mvUrlResult$.value = res?.url ?? '';
    } catch {
      loading.value = false;
    } finally {
      loading.value = false;
    }
  };

  const queryCommentList = async () => {
    try {
      const commonService = new CommonService();
      const res = await commonService.getMvCommentList(mvid);
      mvCommentResult$.value = {
        comments: res?.comments ?? [],
        hotComments: res?.hotComments ?? [],
      };
    } catch {
      loading.value = false;
    } finally {
      loading.value = false;
    }
  };

  // 进入页面即拉取详情 / 地址 / 评论。
  loading.value = true;
  const commonService = new CommonService();
  commonService
    .getMvDetailById(mvid)
    .then((res) => {
      // 上游无详情时保留默认空态，避免把 undefined 写进 ref 导致模板渲染报错
      if (res) {
        mvDetailResult$.value = res;
      }
    })
    .catch(() => {
      loading.value = false;
    });
  queryUrl();
  queryCommentList();

  return {
    mvDetailResult$,
    mvUrlResult$,
    mvCommentResult$,
    loading,
    queryUrl,
    queryCommentList,
  };
};

/** MV 播放页状态：每次调用创建新实例，保证切换 mvid 后重新拉数据 */
export const useMvPlayer = () => create();
