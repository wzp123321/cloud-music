/*
 * @Descrption: nav
 * @Author: mikey.zhaopeng
 * @Date: 2022-06-11 20:50:37
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 15:44:34
 */
import { defineComponent, PropType, toRef } from 'vue';
import { useRouter } from 'vue-router';

import { CodeNameKV } from '@/services/common-api/common-api';

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
      type: Array as PropType<CodeNameKV<string>[]>,
      default: [],
    },
    // 选中id
    selectedCode: {
      type: String,
      default: '',
    },
    // 加载更多地址
    loadMoreUrl: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const router = useRouter();
    const title = toRef(props, 'title');
    const navs = toRef(props, 'navs');
    const selectedCode = toRef(props, 'selectedCode');
    const loadMoreUrl = toRef(props, 'loadMoreUrl');

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

      onNavChange,
      loadMore,
    };
  },
});
