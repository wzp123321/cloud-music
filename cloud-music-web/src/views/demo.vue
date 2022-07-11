<template>
  <div class="demo">
    <el-button class="rx-test">测试Rx点击</el-button>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

import { Observable } from 'rxjs';

export default defineComponent({
  name: 'Demo',
  setup() {
    // const count = 0;
    // const button = document.querySelector('button.rx-test');
    // Observable.fromEvent(button, 'click')
    //   .scan((count) => count + 1, 0) // scan操作符的工作原理类似于数组的reduce，它需要一个暴露给回调函数当参数的初始值，每次回调函数运行后的返回值会作为下次回调函数运行时的参数
    //   .subscribe((count) => console.log('count-----', count));
  },
});
</script>
<style lang="less" scoped></style>
