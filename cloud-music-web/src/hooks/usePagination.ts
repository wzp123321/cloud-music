import { computed, ref, type Ref } from 'vue';

/** 本地分页：基于一个已有的响应式数组，派生当前页数据 */
export const usePagination = <T>(source: Ref<T[]>, pageSize = 20) => {
  const page = ref<number>(1);
  const total = computed(() => source.value?.length ?? 0);
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
  const list = computed<T[]>(() => {
    const start = (page.value - 1) * pageSize;
    return (source.value ?? []).slice(start, start + pageSize);
  });

  const setPage = (value: number) => {
    page.value = Math.min(Math.max(1, value), pageCount.value);
  };
  const next = () => setPage(page.value + 1);
  const prev = () => setPage(page.value - 1);
  const reset = () => {
    page.value = 1;
  };

  return { page, pageSize, total, pageCount, list, setPage, next, prev, reset };
};

/** 无限滚动列表：按页累加，适合评论 / 动态流 */
export const useInfiniteList = <T>(loadPage: (page: number) => Promise<T[]>) => {
  const items = ref<T[]>([]) as Ref<T[]>;
  const page = ref<number>(0);
  const loading = ref<boolean>(false);
  const finished = ref<boolean>(false);

  /** 追加下一页；返回本次新增条数 */
  const loadMore = async (): Promise<number> => {
    if (loading.value || finished.value) {
      return 0;
    }
    loading.value = true;
    try {
      const nextPage = page.value + 1;
      const chunk = await loadPage(nextPage);
      const list = Array.isArray(chunk) ? chunk : [];
      items.value = [...items.value, ...list];
      page.value = nextPage;
      if (!list.length) {
        finished.value = true;
      }
      return list.length;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    items.value = [];
    page.value = 0;
    finished.value = false;
  };

  return { items, page, loading, finished, loadMore, reset };
};
