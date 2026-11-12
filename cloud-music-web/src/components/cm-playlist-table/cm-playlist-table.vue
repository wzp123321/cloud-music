<template>
  <table scroll-y>
    <thead>
      <tr>
        <th style="width: 40px">序号</th>
        <th style="max-width: 100px">名称</th>
        <th>歌手</th>
        <th>专辑</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody style="height: 200px">
      <tr v-for="(item, index) in list" :key="item.id ?? index">
        <td style="width: 40px">{{ index + 1 }}</td>
        <td style="max-width: 100px">{{ item.name }}</td>
        <td>{{ item.artist }}</td>
        <td>{{ item.alName }}</td>
        <td>
          <cm-icon name="icon-24gf-play" title="播放" @click="emit('play', item)"></cm-icon>
          <cm-icon name="icon-Close" title="删除" @click="emit('remove', item.id)"></cm-icon>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { PL_IPlayVO } from '@/apis/play-list/index.api';

/** 播放队列紧凑表格：业务层只传数据、接事件，原生 table 细节收敛在组件内 */
defineOptions({ name: 'CmPlaylistTable' });

defineProps<{ list: PL_IPlayVO[] }>();
const emit = defineEmits<{
  play: [item: PL_IPlayVO];
  remove: [id: number];
}>();
</script>

<style scoped lang="less">
table {
  width: 100%;

  thead tr th {
    padding-left: 0;
    padding-right: 0;
    text-align: center;
  }

  tbody tr td {
    height: 40px;
    line-height: 40px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }
}
</style>
