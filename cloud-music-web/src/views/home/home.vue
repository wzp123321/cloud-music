<template>
  <div class="home">
    <Header></Header>
    <div class="container">
      <router-view></router-view>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import Header from '../header/header.vue';

export default defineComponent({
  components: {
    Header,
  },
});
</script>
<style lang="less" scoped>
.home {
  width: 100%;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  .container {
    width: 1400px;
    margin: 0 auto;
    flex: 1 1 auto;
  }
}
</style>
