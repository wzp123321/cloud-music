<template>
  <div class="header">
    <div class="header-container flex-row-justify-center">
      <div class="flex-row-start-center">
        <img src="../../assets/images/logo.png" />
        <ul class="header-container--tabs">
          <li
            v-for="(item, index) in headerService.menus"
            :key="'menus-' + index"
            :class="{ active: headerService.currentTab === item.url }"
            @click="onLinkTo(item.url)"
          >
            {{ item.name }}
          </li>
        </ul>
      </div>
      <div class="flex-row-start-center">
        <input />
        <div class="header-tabs">121</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import headerService from './header.service';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
    headerService.adjustActiveTab();
  },
);
</script>
<style lang="less" scoped>
.header {
  border-bottom: 1px solid var(--color-text-border);
  width: 100%;
  height: 67px;
  line-height: 67px;

  &-container {
    width: 1200px;
    margin: 0 auto;

    &--tabs {
      li {
        cursor: pointer;
        display: inline-block;
        height: 67px;
        line-height: 67px;
        padding: 0 24px;
      }

      li:not(.active):hover {
        background-color: #ffed85;
        transition: all 233ms;
      }

      li.active {
        background-color: #ffe443;
        color: var(--color-text-title);
        font-weight: 600;
      }
    }

    img {
      height: 48px;
    }
  }
}
</style>
