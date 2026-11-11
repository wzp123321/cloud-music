import { FGetQueryParam } from '@/core/token';
import { computed, reactive, ref } from 'vue';
import musicService from '../../../apis/play-controller/pc.service';
import { getRequest } from '@/apis/request';
import { AD_IMusicVO } from '../../../apis/artist-detail/artist-detail-api';

enum EPath {
  查询歌曲详情 = '/song/detail',
}

const create = () => {
  //#region
  const _musicDetail = ref<AD_IMusicVO>({
    name: '',
    id: 0,
    ar: [],
    alia: [],
    al: {
      id: 0,
      name: '',
      picUrl: '',
      pic_str: '',
      pic: 0,
    },
    dt: 0,
    copyright: 0,
    mark: 0,
    publishTime: 0,
  });

  /**
   * $ 后缀字段必须保持为 Ref，供组件 watch(svc.musicDetail$, ...) 订阅。
   * 这里用 computed 包一层再放进 reactive：reactive 只解包一层，
   * 取到的仍是 _musicDetail 这个 Ref 本身，而不是它的 .value。
   */
  const musicDetail$ = computed(() => _musicDetail);
  //#endregion

  //#region
  const _lyric = ref<string>('');

  // 普通取值字段：交给 reactive 自动解包，调用方拿到的是值而非 Ref。
  const lyric = computed(() => _lyric.value);
  //#endregion

  const queryLyric = async () => {
    const id = Number(FGetQueryParam('id'));
    await musicService.getLyricById({ id });
  };

  const query = async () => {
    const id = FGetQueryParam('id') as string;
    const res = await getRequest(EPath.查询歌曲详情, { ids: id });
    if (res?.songs) {
      _musicDetail.value = res?.songs?.[0];
      queryLyric();
    }
  };

  return reactive({ musicDetail$, lyric, query, queryLyric });
};

/** 歌曲详情页面状态：每次调用创建新实例，与原 new Service() 一致（URL 参数按次重读） */
export const useMusicDetail = () => create();
