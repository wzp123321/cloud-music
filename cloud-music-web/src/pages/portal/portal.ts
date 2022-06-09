/*
 * @Description: 首页
 * @Author: wanzp
 * @Date: 2022-06-09 22:15:56
 * @Last Modified by: wanzp
 * @Last Modified time: 2022-06-09 22:37:53
 */
import { defineComponent, onMounted } from 'vue';
import { ElCarousel, ElCarouselItem } from 'element-plus';

import portal from './services/portal.service';

export default defineComponent({
  name: 'Portal',
  components: {
    'el-carousel': ElCarousel,
    'el-carousel-item': ElCarouselItem,
  },
  setup() {
    //初始化
    onMounted(() => {
      portal.init();
    });

    return {
      portal,
    };
  },
});
