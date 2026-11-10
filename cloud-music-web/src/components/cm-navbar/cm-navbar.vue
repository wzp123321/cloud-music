<template>
<div class="cm-navbar flex-row-start-end">
  <h5 v-if="title">{{ title }}</h5>
  <ul v-if="navs?.length">
    <li
      v-for="(item, index) in navs"
      :key="'nav_'+ index"
      :class="[selectedCode === item.code ? 'selected' : '' , `font${fontSize}`]"
      @click="onNavChange(item.code)"
    >
      {{ item.name }}
    </li>
  </ul>
  <span v-if="hasLoadMore" :class="['load-more', `font${fontSize}`]" @click="loadMore">
    更多
    <i :class="['iconfont icon-xiangyou', `font${fontSize}`]"></i>
  </span>
</div>

</template>

<script lang="ts">
/*
 * @Descrption: nav
 * @Author: mikey.zhaopeng
 * @Date: 2022-06-11 20:50:37
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:53:50
 */
import { defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';

import { ICodeName } from '@/apis/common/index.api';

export default defineComponent({
  name: 'CmNavBar',
  props: {
    // 标题
    title: {
      type: String,
      default: '',
    },
    // 菜单
    navs: {
      type: Array as PropType<ICodeName<string>[]>,
      default: () => [],
    },
    // 选中id
    selectedCode: {
      type: String,
      default: '',
    },
    // 是否有加载更多
    hasLoadMore: {
      type: Boolean,
      default: true,
    },
    // 加载更多地址
    loadMoreUrl: {
      type: String,
      default: '',
    },
    // 字体
    fontSize: {
      type: Number,
      default: 14,
    },
  },
  // 选中项双向绑定 + 切换通知
  emits: ['update:selectedCode', 'change'],
  setup(props, { emit }) {
    const router = useRouter();

    // 切换
    const onNavChange = (code: string) => {
      emit('update:selectedCode', code);
      emit('change', code);
    };
    // 加载更多
    const loadMore = () => {
      router.push({
        path: props.loadMoreUrl,
      });
    };

    // props 在模板中可直接访问，无需再用 toRef 转发一次
    return {
      onNavChange,
      loadMore,
    };
  },
});

</script>

<style lang="less" scoped>
.cm-navbar {
  h5 {
    font-size: 28px;
    margin-right: 40px;
  }

  ul {
    flex: 1 1 auto;
    flex-wrap: wrap;
  }

  ul li {
    cursor: pointer;
    display: inline-block;
    height: 22px;
    line-height: 22px;
    color: var(--color-text-secondary);
  }

  ul li.selected {
    position: relative;
    font-weight: 600;
    color: var(--color-text);

    &::before {
      position: absolute;
      content: '';
      left: 0;
      bottom: 1px;
      width: 100%;
      height: 6px;
      background: #ffe443;
      z-index: -1;
    }
  }

  ul > li + li {
    margin-left: 40px;
  }

  span.load-more {
    color: var(--color-text-secondary);
    height: 22px;
    line-height: 22px;
  }
}

</style>
