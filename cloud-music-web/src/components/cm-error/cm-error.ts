/*
 * @Descrption: 缺省
 * @Author: wanzp
 * @Date: 2022-07-10 15:28:48
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 21:37:24
 */
import { defineComponent, toRef } from 'vue';

export default defineComponent({
  name: 'CmSkeleton',
  props: {
    title: {
      type: String,
      default: '暂无数据',
    },
  },
  setup(props) {
    const title = toRef(props, 'title');

    return {
      title,
    };
  },
});
