import { onMounted, ref } from 'vue';
import {
  getPlaylistCatlist,
  getPlaylistHot,
  getHighqualityTags,
  getTopPlaylistHighquality,
  PM_IPlaylistVO,
} from '@/apis/playlist-manage/index.api';

export function usePlaylistView() {
  const loading = ref(false);
  const listLoading = ref(false);
  const selectedCat = ref('全部');
  const showAll = ref(false);

  const hotTags = ref<{ name: string }[]>([]);
  const hqTags = ref<{ name: string }[]>([]);
  const catGroups = ref<{ categoryName: string; subs: { name: string }[] }[]>([]);
  const playlists = ref<PM_IPlaylistVO[]>([]);

  const createVisible = ref(false);

  const onSelectCat = (cat: string) => {
    selectedCat.value = cat;
    fetchHighquality(cat);
  };

  const openCreate = () => {
    createVisible.value = true;
  };

  const onCreated = () => {
    // 创建后跳转到我的歌单页
    window.location.href = '/playlist/my';
  };

  const fetchCatalogue = async () => {
    loading.value = true;
    try {
      const [catRes, hotRes, hqRes] = await Promise.all([
        getPlaylistCatlist(),
        getPlaylistHot(),
        getHighqualityTags(),
      ]);

      if (catRes?.code === 200 && catRes?.sub?.length) {
        const categoryNames = catRes.categories || {};
        const groups: { [k: string]: { categoryName: string; subs: { name: string }[] } } = {};
        catRes.sub.forEach((sub) => {
          const key = String(sub.category);
          if (!groups[key]) {
            groups[key] = { categoryName: categoryNames[key] || '其他', subs: [] };
          }
          groups[key].subs.push({ name: sub.name });
        });
        catGroups.value = Object.values(groups);
      }

      const hotTagsRaw = hotRes?.tags || hotRes?.data || [];
      hotTags.value = hotTagsRaw.map((t: any) => ({ name: t.name }));

      const hqTagsRaw = hqRes?.tags || [];
      hqTags.value = hqTagsRaw.map((t: any) => ({ name: t.name }));
    } catch {
      // 分类接口异常不影响精品列表
    } finally {
      loading.value = false;
    }
  };

  const fetchHighquality = async (cat: string) => {
    listLoading.value = true;
    try {
      const realCat = cat === '全部' ? '全部' : cat;
      const res = await getTopPlaylistHighquality({ cat: realCat, limit: 50 });
      if (res?.code === 200 && res?.playlists?.length) {
        playlists.value = res.playlists;
      } else {
        playlists.value = [];
      }
    } catch {
      playlists.value = [];
    } finally {
      listLoading.value = false;
    }
  };

  onMounted(() => {
    fetchCatalogue();
    fetchHighquality(selectedCat.value);
  });

  return {
    loading,
    listLoading,
    selectedCat,
    showAll,
    hotTags,
    hqTags,
    catGroups,
    playlists,
    createVisible,
    onSelectCat,
    openCreate,
    onCreated,
  };
}
