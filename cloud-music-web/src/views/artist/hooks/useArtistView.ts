import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import contentEnhanceService, { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import { ContentArtistItem, ContentSongItem, ContentMvItem } from '@/apis/content-enhance/index.api';

export function useArtistView() {
  const router = useRouter();

  const typeOptions = [
    { name: '男歌手', value: '1' },
    { name: '女歌手', value: '2' },
    { name: '乐队', value: '3' },
  ];

  const areaOptions = [
    { name: '全部', value: -1 },
    { name: '华语', value: 7 },
    { name: '欧美', value: 96 },
    { name: '日本', value: 8 },
    { name: '韩国', value: 16 },
    { name: '其他', value: 0 },
  ];

  const activeType = ref<string>('1');
  const activeArea = ref<number>(-1);
  const loading = ref<boolean>(false);
  const hasLogin = checkLogin();
  const artistList = ref<ContentArtistItem[]>([]);
  const followedArtists = ref<ContentArtistItem[]>([]);
  const newSongs = ref<ContentSongItem[]>([]);
  const newMvs = ref<ContentMvItem[]>([]);

  /** 歌手分类列表，参数由页面筛选条提供 */
  const loadArtists = async () => {
    loading.value = true;
    try {
      const res = await contentEnhanceService.getArtistList({
        type: activeType.value,
        area: activeArea.value,
        limit: 30,
      });
      artistList.value = res?.artists || [];
    } catch {
      artistList.value = [];
    } finally {
      loading.value = false;
    }
  };

  /** 需登录的三块内容：未登录不发起请求，只做降级展示 */
  const loadLoginOnlySections = async () => {
    if (!hasLogin) return;
    const [sublist, songs, mvs] = await Promise.all([
      contentEnhanceService.getArtistSublist({ limit: 25 }).catch(() => null),
      contentEnhanceService.getArtistNewSong({ limit: 10 }).catch(() => null),
      contentEnhanceService.getArtistNewMv({ limit: 10 }).catch(() => null),
    ]);
    followedArtists.value = (sublist?.data as ContentArtistItem[]) || [];
    const songData: any = songs?.data;
    newSongs.value = (Array.isArray(songData) ? songData : songData?.list || []) as ContentSongItem[];
    const mvData: any = mvs?.data;
    newMvs.value = (Array.isArray(mvData) ? mvData : mvData?.list || []) as ContentMvItem[];
  };

  const switchType = (value: string) => {
    if (activeType.value === value) return;
    activeType.value = value;
    loadArtists();
  };

  const switchArea = (value: number) => {
    if (activeArea.value === value) return;
    activeArea.value = value;
    loadArtists();
  };

  const formatArtists = (song: ContentSongItem): string =>
    (song.ar || song.artists || []).map((artist) => artist.name || '').join(' / ');

  /** 列表 → 详情参数来源：artists[].id 传入 /artist_detail?id= */
  const linkToArtist = (id?: number) => {
    if (!id) return;
    router.push({ path: '/artist_detail', query: { id: String(id) } });
  };
  const linkToSong = (id?: number) => {
    if (!id) return;
    router.push({ path: '/music_detail', query: { id: String(id) } });
  };
  const linkToMv = (id?: number) => {
    if (!id) return;
    router.push({ path: '/mvplay', query: { mvid: String(id) } });
  };

  onMounted(() => {
    loadArtists();
    loadLoginOnlySections();
  });

  return {
    typeOptions,
    areaOptions,
    activeType,
    activeArea,
    loading,
    hasLogin,
    artistList,
    followedArtists,
    newSongs,
    newMvs,
    switchType,
    switchArea,
    formatArtists,
    linkToArtist,
    linkToSong,
    linkToMv,
  };
}
