import { ref } from 'vue';
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

// 对外直出各 ref，消费方解构后使用（脚本内 .value，模板自动解包）
export const useDjProgramDetail = () => {
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

  return { program, loading, error, query };
};
