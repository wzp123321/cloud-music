import { ref, reactive } from 'vue';
import { getQueryParam } from '@/core/token';
import djRadioService from '@/apis/dj-radio/dj-radio.service';

/** 电台详情 VO（dj_detail → data） */
export interface DjRadioVO {
  id: number;
  name: string;
  picUrl: string;
  desc: string;
  category: string;
  secondCategory: string;
  subCount: number;
  programCount: number;
  commentCount: number;
  playCount: number;
  createTime: number;
  dj: {
    userId: number;
    nickname: string;
    avatarUrl: string;
    signature: string;
  };
}

/** 电台节目 VO（dj_program → programs[]） */
export interface DjProgramVO {
  id: number;
  name: string;
  coverUrl: string;
  description: string;
  listenerCount: number;
  likedCount: number;
  commentCount: number;
  createTime: number;
  serialNum: number;
  duration: number;
  mainSong: {
    id: number;
    name: string;
    duration: number;
  };
  radio: {
    id: number;
    name: string;
  };
}

// 电台详情状态层：同时拉取电台信息与其节目列表
const create = () => {
  const radio = ref<DjRadioVO | null>(null);
  const programs = ref<DjProgramVO[]>([]);
  const loading = ref<boolean>(true);
  const error = ref<boolean>(false);
  const _rid = ref<number>(0);
  const subLoading = ref<boolean>(false);
  const isSub = ref<boolean>(false);

  const query = async () => {
    const rid = Number(getQueryParam('rid')) || 0;
    _rid.value = rid;
    if (!rid) {
      error.value = true;
      loading.value = false;
      return;
    }
    loading.value = true;
    error.value = false;
    try {
      const [detailRes, programRes] = await Promise.all([
        djRadioService.getDjDetail({ rid }),
        djRadioService.getDjProgram({ rid, limit: 50 }),
      ]);
      if (detailRes?.code === 200 && detailRes?.data) {
        radio.value = detailRes.data as DjRadioVO;
      } else {
        radio.value = null;
      }
      if (programRes?.code === 200 && programRes?.programs) {
        programs.value = programRes.programs as DjProgramVO[];
      } else {
        programs.value = [];
      }
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  };

  /** 订阅 / 取消订阅电台（写操作）：t=1 订阅，t=0 取消 */
  const toggleSub = async () => {
    if (!_rid.value || subLoading.value) return;
    const t = isSub.value ? 0 : 1;
    subLoading.value = true;
    try {
      const res = await djRadioService.setDjSub({ rid: _rid.value, t: t as 1 | 0 });
      if (res?.code === 200) {
        isSub.value = !isSub.value;
      }
    } finally {
      subLoading.value = false;
    }
  };

  const state = reactive({
    radio,
    programs,
    loading,
    error,
    subLoading,
    isSub,
    query,
    toggleSub,
  });
  return state;
};

/** 电台详情页状态：每次调用创建新实例，保证切换 rid 后重新初始化 */
export const useDjRadioDetail = () => create();
