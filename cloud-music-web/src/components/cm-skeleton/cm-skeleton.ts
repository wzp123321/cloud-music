/*
 * @Descrption: 骨架屏
 * @Author: wanzp
 * @Date: 2022-07-10 15:28:48
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-07-10 17:06:43
 */
import { defineComponent, PropType, toRef, watch, ref } from 'vue';

export default defineComponent({
  name: 'CmSkeleton',
  props: {
    width: {
      type: String,
      default: '100%',
    },
    height: {
      type: String,
      default: '100%',
    },
    borderRadius: {
      type: String,
      default: 'none',
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const width = toRef(props, 'width');
    const height = toRef(props, 'height');
    const imageUrl = toRef(props, 'imageUrl');
    const borderRadius = toRef(props, 'borderRadius');

    const loaded = ref<boolean>(false);

    watch(
      () => props.imageUrl,
      (newVal) => {
        if (!newVal) {
          return;
        }
        const img = new Image();
        img.src = newVal;
        img.onload = (e) => {
          loaded.value = true;
        };
      },
      {
        immediate: true,
      },
    );

    return {
      width,
      height,
      borderRadius,
      imageUrl,
      loaded,
    };
  },
});
