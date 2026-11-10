import { FGetQueryParam } from '@/core/token';
import { computed, reactive, ref } from 'vue';

import CommonService from '../../services/common.service';
import { MP_IMvDetail, MP_IMVCommentRes } from './mvplay.api';

const create = () => {
  //#region
  const _mvDetailResult = ref<MP_IMvDetail>({
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

  const _mvUrlResult = ref<string>('');

  const _mvCommentResult = ref<MP_IMVCommentRes>({
    comments: [],
    hotComments: [],
  });

  /**
   * $ 后缀字段保持为 Ref：computed 包一层后放进 reactive 只解包一层，
   * 组件里 watch(svc.mvDetailResult$, ...) 等订阅拿到的仍是 Ref。
   */
  const mvDetailResult$ = computed(() => _mvDetailResult);
  const mvUrlResult$ = computed(() => _mvUrlResult);
  const mvCommentResult$ = computed(() => _mvCommentResult);
  //#endregion

  //#region
  const _mvid = Number(FGetQueryParam('mvid'));

  const _loading = ref<boolean>(false);

  // loading 为普通取值字段，经 reactive 解包后模板拿到布尔值。
  const loading = computed(() => _loading.value);
  //#endregion

  const queryUrl = async () => {
    try {
      const commonService = new CommonService();
      const res = await commonService.getMvUrlById(_mvid);
      _mvUrlResult.value = res?.url;
    } catch {
      _loading.value = false;
    } finally {
      _loading.value = false;
    }
  };

  const queryCommentList = async () => {
    try {
      const commonService = new CommonService();
      const res = await commonService.getMvCommentList(_mvid);
      console.log(res);
      _mvCommentResult.value = res;
    } catch {
      _loading.value = false;
    } finally {
      _loading.value = false;
    }
  };

  // 等价于原 constructor：进入页面即拉取详情 / 地址 / 评论。
  _loading.value = true;
  const commonService = new CommonService();
  commonService
    .getMvDetailById(_mvid)
    .then((res) => {
      _mvDetailResult.value = res as MP_IMvDetail;
    })
    .catch(() => {
      _loading.value = false;
    });
  queryUrl();
  queryCommentList();

  return reactive({
    mvDetailResult$,
    mvUrlResult$,
    mvCommentResult$,
    loading,
    queryUrl,
    queryCommentList,
  });
};

/** MV 播放页状态：每次调用创建新实例，保证切换 mvid 后重新拉数据 */
export const useMvPlayer = () => create();
