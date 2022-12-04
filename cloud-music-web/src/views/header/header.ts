/*
 * @Description: 头部
 * @Author: wanzp
 * @Date: 2022-06-09 22:23:48
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-09-10 20:52:46
 */
import { defineComponent, ref } from 'vue';
import header from './services/header.service';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'Header',
  setup() {
    const route = useRoute();
    const router = useRouter();

    header.loadDefaultKeyword();

    const onLinkTo = (url: string) => {
      router.push({
        path: url,
        query: route.query,
      });
    };

    const linkToPortal = () => {
      router.replace({
        path: '/',
      });
    };

    const handleSearch = () => {
      router.replace({
        path: '/search',
        query: {
          keyword: header.keyword,
        },
      });
      header.keyword = '';
    };

    watch(
      () => route.path,
      () => {
        header.adjustActiveTab(route.path);
      },
    );

    return {
      header,

      handleSearch,
      onLinkTo,
      linkToPortal,
    };
  },
});
