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
      <tr
        v-for="(item, index) in list"
        :key="item.id ?? index"
        draggable="true"
        :class="{ 'row-dragging': dragIndex === index, 'row-drop-target': dragOverIndex === index }"
        @click="handleRowClick(item)"
        @dragstart="onDragStart(index, $event)"
        @dragover="onDragOver(index, $event)"
        @dragleave="onDragLeave(index)"
        @drop="onDrop(index, $event)"
        @dragend="onDragEnd"
      >
        <td style="width: 40px">{{ index + 1 }}</td>
        <td style="max-width: 100px">{{ item.name }}</td>
        <td>{{ item.artist }}</td>
        <td>{{ item.alName }}</td>
        <td>
          <cm-icon name="icon-24gf-play" title="播放" @click.stop="emit('play', item)"></cm-icon>
          <cm-icon name="icon-Close" title="删除" @click.stop="emit('remove', item.id)"></cm-icon>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PL_PlayVO } from '@/apis/play-list/index.api';

/** 播放队列紧凑表格：业务层只传数据、接事件，原生 table 细节收敛在组件内 */
defineOptions({ name: 'CmPlaylistTable' });

defineProps<{ list: PL_PlayVO[] }>();
const emit = defineEmits<{
  play: [item: PL_PlayVO];
  remove: [id: number];
  reorder: [from: number, to: number];
}>();

const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
/** 拖拽进行中标志：用于抑制 dragend 后可能紧随的一次 click，避免拖完即切歌 */
const isDragging = ref(false);

const onDragStart = (index: number, e: DragEvent) => {
  dragIndex.value = index;
  isDragging.value = true;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    // Firefox 必须设置 data 才会触发 dragover/drop
    e.dataTransfer.setData('text/plain', String(index));
  }
};

const onDragOver = (index: number, e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  dragOverIndex.value = index;
};

const onDragLeave = (index: number) => {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null;
  }
};

const onDrop = (index: number, e: DragEvent) => {
  e.preventDefault();
  const from = dragIndex.value;
  if (from !== null && from !== index) {
    emit('reorder', from, index);
  }
  dragOverIndex.value = null;
  dragIndex.value = null;
};

const onDragEnd = () => {
  dragIndex.value = null;
  dragOverIndex.value = null;
  // click 可能紧随 dragend 触发，延后一拍清除标志以屏蔽这次误触
  setTimeout(() => {
    isDragging.value = false;
  }, 0);
};

const handleRowClick = (item: PL_PlayVO) => {
  if (isDragging.value) {
    return;
  }
  emit('play', item);
};
</script>

<style scoped lang="less">
table {
  width: 100%;

  thead tr th {
    padding-left: 0;
    padding-right: 0;
    text-align: center;
  }

  tbody tr {
    &.row-dragging {
      opacity: 0.4;
    }

    &.row-drop-target td {
      background: var(--color-primary);
      opacity: 0.6;
    }

    td {
      height: 40px;
      line-height: 40px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
  }
}
</style>
