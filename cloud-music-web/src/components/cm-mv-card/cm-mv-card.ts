/*
 * @Descrption: MV
 * @Author: wanzp
 * @Date: 2022-06-12 19:42:40
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-06-12 20:43:33
 */
import { defineComponent, toRef } from 'vue';

import { formatPlayCount, formatDuration } from '@/core/utils';

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
      type: String,
      default: '',
    },
    id: {
      type: Number,
      default: 0,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const coverImageUrl = toRef(props, 'coverImageUrl');
    const title = toRef(props, 'title');
    const publishTime = toRef(props, 'publishTime');
    const id = toRef(props, 'id');
    const playCount = toRef(props, 'playCount');
    const duration = toRef(props, 'duration');

    return {
      coverImageUrl,
      title,
      publishTime,
      id,
      playCount,
      duration,

      formatPlayCount,
      formatDuration,
    };
  },
});
