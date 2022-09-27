/*
 * @Descrption: nav
 * @Author: mikey.zhaopeng
 * @Date: 2022-06-11 20:50:37
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:53:50
 */
import { defineComponent, PropType, toRef } from 'vue';
import { useRouter } from 'vue-router';

import { ICodeName } from '@/services/common-api/common-api';

export default defineComponent({
  name: 'CmNavBar',
  props: {
    // 标题
    title: {
      type: String,
      default: '',
    },
    // 菜单
    navs: {
      type: Array as PropType<ICodeName<string>[]>,
      default: [],
    },
    // 选中id
    selectedCode: {
      type: String,
      default: '',
    },
    // 是否有加载更多
    hasLoadMore: {
      type: Boolean,
      default: true,
    },
    // 加载更多地址
    loadMoreUrl: {
      type: String,
      default: '',
    },
    // 字体
    fontSize: {
      type: Number,
      default: 14,
    },
  },
  setup(props, { emit }) {
    const router = useRouter();
    const title = toRef(props, 'title');
    const navs = toRef(props, 'navs');
    const selectedCode = toRef(props, 'selectedCode');
    const loadMoreUrl = toRef(props, 'loadMoreUrl');
    const hasLoadMore = toRef(props, 'hasLoadMore');
    const fontSize = toRef(props, 'fontSize');

    // 切换
    const onNavChange = (code: string) => {
      emit('update:selectedCode', code);
      emit('change', code);
    };
    // 加载更多
    const loadMore = () => {
      router.push({
        path: loadMoreUrl.value,
      });
    };

    return {
      title,
      navs,
      selectedCode,
      loadMoreUrl,
      hasLoadMore,
      fontSize,

      onNavChange,
      loadMore,
    };
  },
});
