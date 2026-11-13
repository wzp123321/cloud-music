import { ref, reactive } from 'vue';
import { getQueryParam } from '@/core/token';
import djRadioService from '@/apis/dj-radio/dj-radio.service';

/** 电台节目详情 VO（dj_program_detail → data.program） */
export interface DjProgramDetailVO {
  id: number;
  name: string;
  coverUrl: string;
  description: string;
  listenerCount: number;
  likedCount: number;
  commentCount: number;
  createTime: number;
  duration: number;
  categoryName: string;
  mainSong: {
    id: number;
    name: string;
    duration: number;
  };
  dj: {
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
  radio: {
    id: number;
    name: string;
    picUrl: string;
  };
}

// 电台节目详情状态层
const create = () => {
  const program = ref<DjProgramDetailVO | null>(null);
  const loading = ref<boolean>(true);
  const error = ref<boolean>(false);

  const query = async () => {
    const id = Number(getQueryParam('id')) || 0;
    if (!id) {
      error.value = true;
      loading.value = false;
      return;
    }
    loading.value = true;
    error.value = false;
    try {
      const res = await djRadioService.getDjProgramDetail({ id });
      if (res?.code === 200 && res?.data?.program) {
        program.value = res.data.program as DjProgramDetailVO;
      } else {
        program.value = null;
      }
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  };

  const state = reactive({
    program,
    loading,
    error,
    query,
  });
  return state;
};

/** 节目详情页状态：每次调用创建新实例，保证切换 id 后重新初始化 */
export const useDjProgramDetail = () => create();
