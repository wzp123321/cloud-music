/*
 * @Descrption: 歌单卡片
 * @Author: wanzp
 * @Date: 2022-06-12 19:42:40
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-06-12 20:43:33
 */
import { defineComponent, toRef } from 'vue';

export default defineComponent({
  name: 'PlayListCard',
  props: {
    coverImageUrl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      defualt: '',
    },
    playCount: {
      type: Number,
      default: 0,
    },
    id: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    // const coverImageUrl = toRef(props, 'coverImageUrl');
    // const title = toRef(props, 'title');
    // const playCount = toRef(props, 'playCount');
    // const id = toRef(props, 'id');
    // return {
    //   coverImageUrl,
    //   title,
    //   id,
    //   playCount,
    // };
  },
});
