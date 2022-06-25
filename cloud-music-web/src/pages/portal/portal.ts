/*
 * @Description: 首页
 * @Author: wanzp
 * @Date: 2022-06-09 22:15:56
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-06-25 16:06:44
 */
import { defineComponent, onMounted } from 'vue';
import { ElCarousel, ElCarouselItem } from 'element-plus';

import portal from './services/portal.service';

import RankDetail from './portal-rank-detail/portal-rank-detail.vue';

export default defineComponent({
  name: 'Portal',
  components: {
    'el-carousel': ElCarousel,
    'el-carousel-item': ElCarouselItem,
    'port-rank-detail': RankDetail,
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
