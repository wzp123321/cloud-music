/*
 * @Descrption: MV
 * @Author: wanzp
 * @Date: 2022-06-12 19:42:40
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-06-12 20:43:33
 */
import { defineComponent, toRef } from 'vue';

import { formatDate } from '@/core/utils';

export default defineComponent({
  name: 'CMAMVCard',
  props: {
    coverImageUrl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      defualt: '',
    },
    publishTime: {
      type: Number,
      default: 0,
    },
    id: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const coverImageUrl = toRef(props, 'coverImageUrl');
    const title = toRef(props, 'title');
    const publishTime = toRef(props, 'publishTime');
    const id = toRef(props, 'id');

    return {
      coverImageUrl,
      title,
      publishTime,
      id,

      formatDate,
    };
  },
});
