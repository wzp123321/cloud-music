/*
 * @Description: 头部
 * @Author: wanzp
 * @Date: 2022-06-09 22:23:48
 * @Last Modified by: wanzp
 * @Last Modified time: 2022-06-09 22:28:08
 */
import { defineComponent } from 'vue';
import headerService from './services/header.service';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'Header',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const onLinkTo = (url: string) => {
      router.push({
        path: url,
        query: route.query,
      });
    };

    watch(
      () => route.path,
      () => {
        headerService.adjustActiveTab(route.path);
      },
    );

    return {
      onLinkTo,

      headerService,
    };
  },
});
