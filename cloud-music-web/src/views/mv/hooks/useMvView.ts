import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { formatPlayCount } from '@/core/utils';
import contentEnhanceService, { hasLogin as checkLogin } from '@/apis/content-enhance/content-enhance.service';
import { ContentMvItem } from '@/apis/content-enhance/index.api';
import message from '@/utils/message';

type TabCode = 'all' | 'exclusive' | 'first';

/** MV 发现页：三个 tab、地区/排序筛选与收藏列表的编排。 */
export const useMvView = () => {
  const router = useRouter();

  const tabs: { code: TabCode; name: string }[] = [
    { code: 'all', name: '全部 MV' },
    { code: 'exclusive', name: '网易出品' },
    { code: 'first', name: '最新 MV' },
  ];

  const areaOptions = ['全部', '内地', '港台', '欧美', '日本', '韩国'];
  const orderOptions = ['上升最快', '最热', '最新'];

  const activeTab = ref<TabCode>('all');
  const activeArea = ref<string>('全部');
  const activeOrder = ref<string>('上升最快');
  const loading = ref<boolean>(false);
  const hasLogin = checkLogin();
  const mvList = ref<ContentMvItem[]>([]);
  const subMvList = ref<ContentMvItem[]>([]);

  /** 三个 tab 各对应一个真实接口调用点 */
  const loadMvList = async () => {
    loading.value = true;
    mvList.value = [];
    try {
      let res;
      switch (activeTab.value) {
        case 'all':
          res = await contentEnhanceService.getMvAll({ area: activeArea.value, order: activeOrder.value, limit: 30 });
          break;
        case 'exclusive':
          res = await contentEnhanceService.getMvExclusiveRcmd({ limit: 30 });
          break;
        case 'first':
          res = await contentEnhanceService.getMvFirst({ limit: 30 });
          break;
      }
      mvList.value = res?.data || [];
    } catch {
      mvList.value = [];
    } finally {
      loading.value = false;
    }
  };

  /** 收藏列表需登录，未登录不请求，只做降级 */
  const loadSubMvList = async () => {
    if (!hasLogin) return;
    try {
      const res = await contentEnhanceService.getMvSublist({ limit: 25 });
      subMvList.value = (res?.data || []) as ContentMvItem[];
    } catch {
      subMvList.value = [];
    }
  };

  const switchTab = (code: TabCode) => {
    if (activeTab.value === code) return;
    activeTab.value = code;
    loadMvList();
  };

  const switchArea = (area: string) => {
    if (activeArea.value === area) return;
    activeArea.value = area;
    loadMvList();
  };

  const switchOrder = (order: string) => {
    if (activeOrder.value === order) return;
    activeOrder.value = order;
    loadMvList();
  };

  /** 列表 → 播放页参数来源：data[].id 传入 /mvplay?mvid= */
  const linkToMv = (id?: number) => {
    if (!id) {
      message.info('该内容暂无详情信息');
      return;
    }
    router.push({ path: '/mvplay', query: { mvid: String(id) } });
  };

  onMounted(() => {
    loadMvList();
    loadSubMvList();
  });

  return {
    tabs,
    activeTab,
    switchTab,
    areaOptions,
    activeArea,
    switchArea,
    orderOptions,
    activeOrder,
    switchOrder,
    loading,
    mvList,
    linkToMv,
    formatPlayCount,
    hasLogin,
    subMvList,
  };
}
