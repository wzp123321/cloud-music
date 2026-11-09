/*
 * @Descrption: 歌单卡片
 * @Author: wanzp
 * @Date: 2022-06-12 19:42:40
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2022-06-12 20:43:33
 */
import { useRouter } from 'vue-router';
import { defineComponent, toRef } from 'vue';

export default defineComponent({
  name: 'CMPlayListCard',
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
    // 扩展：创作者名称（分类/精品浏览展示）
    creator: {
      type: String,
      default: '',
    },
    // 扩展：分类/标签角标
    tag: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const router = useRouter();
    const coverImageUrl = toRef(props, 'coverImageUrl');
    const title = toRef(props, 'title');
    const playCount = toRef(props, 'playCount');
    const id = toRef(props, 'id');
    const creator = toRef(props, 'creator');
    const tag = toRef(props, 'tag');

    const linkToDetailPage = (id: string) => {
      router.push({
        path: '/playlist_detail',
        query: {
          id,
        },
      });
    };

    return {
      coverImageUrl,
      title,
      id,
      playCount,
      creator,
      tag,
      linkToDetailPage,
    };
  },
});
