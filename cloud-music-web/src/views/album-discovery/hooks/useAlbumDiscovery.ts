import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import contentEnhanceService from '@/apis/content-enhance/content-enhance.service';

/** 统一卡片模型：5 个列表接口的字段在这里归一 */
interface AlbumCardItem {
  id: number;
  title: string;
  cover: string;
  subtitle: string;
  rank?: number;
}

type TabCode = 'new' | 'newest' | 'list' | 'style' | 'saleboard';

/**
 * 新碟与数字专辑：tab / 地区 / 榜单周期 → 5 个列表接口的编排。
 * 专辑发现页：分类标签、地区/周期筛选与列表加载编排。
 */
export function useAlbumDiscovery() {
  const router = useRouter();

  const tabs: { code: TabCode; name: string }[] = [
    { code: 'new', name: '全部新碟' },
    { code: 'newest', name: '最新专辑' },
    { code: 'list', name: '数字专辑' },
    { code: 'style', name: '语种风格馆' },
    { code: 'saleboard', name: '专辑销量榜' },
  ];

  const areaOptions = [
    { name: '全部', value: 'ALL' },
    { name: '华语', value: 'ZH' },
    { name: '欧美', value: 'EA' },
    { name: '韩国', value: 'KR' },
    { name: '日本', value: 'JP' },
  ];

  const styleAreaOptions = [
    { name: '华语', value: 'Z_H' },
    { name: '欧美', value: 'E_A' },
    { name: '韩国', value: 'KR' },
    { name: '日本', value: 'JP' },
  ];

  const periodOptions = [
    { name: '日榜', value: 'daily' },
    { name: '周榜', value: 'week' },
    { name: '总榜', value: 'total' },
  ];

  const activeTab = ref<TabCode>('new');
  const activeArea = ref<string>('ALL');
  const activePeriod = ref<string>('daily');
  const loading = ref<boolean>(false);
  const albumList = ref<AlbumCardItem[]>([]);

  const showAreaFilter = computed(
    () => activeTab.value === 'new' || activeTab.value === 'list' || activeTab.value === 'style',
  );
  const currentAreaOptions = computed(() =>
    activeTab.value === 'style' ? styleAreaOptions : areaOptions,
  );

  const toCard = (raw: any, source: TabCode): AlbumCardItem => {
    const isProduct = source === 'list' || source === 'style' || source === 'saleboard';
    const id = Number(isProduct ? raw?.albumId : raw?.id) || 0;
    const cover = (isProduct ? raw?.coverUrl : raw?.picUrl) || '';
    const title = (isProduct ? raw?.albumName : raw?.name) || '未知专辑';
    const artist = isProduct ? raw?.artistName : raw?.artist?.name || raw?.artists?.[0]?.name || '';
    const extra = raw?.saleNum ?? raw?.sales;
    const subtitle = source === 'saleboard' ? `${artist} · 销量 ${extra ?? 0}` : artist || '未知歌手';
    return { id, title, cover, subtitle, rank: source === 'saleboard' ? raw?.rank : undefined };
  };

  /** 每个 tab 对应一个真实接口调用点；地区/周期切换会重新拉取对应接口 */
  const loadAlbums = async () => {
    loading.value = true;
    albumList.value = [];
    try {
      let raw: any[] = [];
      switch (activeTab.value) {
        case 'new': {
          const res = await contentEnhanceService.getAlbumNew({ area: activeArea.value, limit: 30 });
          raw = res?.albums || [];
          break;
        }
        case 'newest': {
          const res = await contentEnhanceService.getAlbumNewest();
          raw = res?.albums || [];
          break;
        }
        case 'list': {
          const res = await contentEnhanceService.getAlbumList({ area: activeArea.value, limit: 30 });
          raw = res?.products || [];
          break;
        }
        case 'style': {
          const res = await contentEnhanceService.getAlbumListStyle({ area: activeArea.value, limit: 10 });
          raw = res?.albumProducts || [];
          break;
        }
        case 'saleboard': {
          const res = await contentEnhanceService.getAlbumSongsaleboard({ type: activePeriod.value });
          raw = res?.products || [];
          break;
        }
      }
      albumList.value = raw.map((item) => toCard(item, activeTab.value)).filter((item) => item.id > 0);
    } catch {
      albumList.value = [];
    } finally {
      loading.value = false;
    }
  };

  const switchTab = (code: TabCode) => {
    if (activeTab.value === code) return;
    activeTab.value = code;
    // 风格馆使用独立的 area 取值（Z_H/E_A/...），切换时重置，避免把 ALL 传给风格接口
    activeArea.value = code === 'style' ? 'Z_H' : 'ALL';
    loadAlbums();
  };

  const switchArea = (value: string) => {
    if (activeArea.value === value) return;
    activeArea.value = value;
    loadAlbums();
  };

  const switchPeriod = (value: string) => {
    if (activePeriod.value === value) return;
    activePeriod.value = value;
    loadAlbums();
  };

  /** 列表 → 详情参数来源：卡片 id 传入 /album_detail?id= */
  const linkToAlbum = (id?: number) => {
    if (!id) return;
    router.push({ path: '/album_detail', query: { id: String(id) } });
  };

  onMounted(loadAlbums);

  return {
    tabs,
    currentAreaOptions,
    periodOptions,
    activeTab,
    activeArea,
    activePeriod,
    showAreaFilter,
    loading,
    albumList,
    switchTab,
    switchArea,
    switchPeriod,
    linkToAlbum,
  };
}
