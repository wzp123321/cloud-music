<template>
<table style="width: 100%">
  <thead>
    <tr>
      <th style="width: 10%">序号</th>
      <th style="width: 30%">歌曲</th>
      <th style="width: 30%">专辑</th>
      <th style="width: 30%">时长</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(item, index) in dataSource.slice((page - 1) * pageSize, page * pageSize)" :key="'song_' + index">
      <td style="width: 10%" class="sort">
        <span>{{ (page - 1) * pageSize + index + 1 }}</span>
        <img :src="item?.picUrl" alt="" />
      </td>
      <td ellipsis style="width: 30%">
        <span class="mname">{{ item.name }}</span>
        <span class="tag">无损</span>
        <span class="mv">mv</span>
      </td>
      <td ellipsis style="width: 30%">{{ item.alName ?? '--' }}</td>
      <td ellipsis style="width: 30%">
        <span class="dt">{{ formatDuration(item.dt) }}</span>
        <div class="op-btn flex-row-start-center">
          <i class="iconfont icon-24gf-play" title="播放" @click="onPlay(index)"></i>
          <i class="iconfont icon-tianjia" title="添加到歌单" @click="handleAddPlayItem(item)"></i>
          <i class="iconfont icon-jushoucang" title="收藏"></i>
          <i class="iconfont icon-xiazai" title="下载"></i>
          <i class="iconfont icon-xiangqing" title="详情" @click="linkToDetailPage(item.id)"></i>
          <i
            v-if="showRemove"
            class="iconfont icon-shanchu"
            title="从歌单移除"
            @click="handleRemove(item)"
          ></i>
        </div>
      </td>
    </tr>
  </tbody>
</table>
<div v-if="total > pageSize" class="flex-row-center-center">
  <el-pagination v-model:current-page="page" layout="prev, pager, next" :total="total" :page-size="pageSize" />
</div>

</template>

<script lang="ts">
/*
 * @Description: 表格
 * @Author: zpwan
 * @Date: 2022-09-27 20:09:36
 * @Last Modified by: zpwan
 * @Last Modified time: 2022-09-27 20:33:30
 */
import { defineComponent, PropType, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

import { formatDuration } from '@/core/utils';

import { usePlayerStore } from '@/stores/player';
import { usePlaylistStore } from '@/stores/playlist';

import { Common_IMusic } from '../../services/common-api/common-api';
import { PL_IPlayVO } from '../../views/home/components/play-list/play-list.api';
import { ElPagination } from 'element-plus';
import message from '@/utils/message';

export default defineComponent({
  name: 'CmTable',
  components: {
    'el-pagination': ElPagination,
  },
  props: {
    dataSource: {
      type: Array as PropType<Common_IMusic[]>,
      default: () => [],
    },
    // 是否展示“从歌单移除”操作（歌单详情页使用）
    showRemove: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['remove'],

  setup(props, { emit }) {
    const page = ref<number>(1);
    const router = useRouter();
    const player = usePlayerStore();
    const playList = usePlaylistStore();

    const pageSize = 20;

    const total = computed(() => {
      return props.dataSource?.length;
    });

    const onPlay = (index: number) => {
      player.play(props.dataSource[index]);
    };

    const handleAddPlayItem = (item: Common_IMusic) => {
      const music: PL_IPlayVO = {
        artist: item?.artist,
        dt: item?.dt,
        url: '',
        alName: item?.alName ?? '',
        name: item.name,
        picUrl: item?.picUrl,
        id: item.id,
      };
      playList.addMusic(music);

      message.success('添加成功');
    };

    const linkToDetailPage = (id: number) => {
      router.push({
        path: '/music_detail',
        query: { id },
      });
    };

    const handleRemove = (item: Common_IMusic) => {
      emit('remove', item);
    };

    return {
      page,
      pageSize,
      total,

      formatDuration,
      onPlay,
      handleAddPlayItem,
      linkToDetailPage,
      handleRemove,
    };
  },
});

</script>

<style lang="less" scoped>
table {
  thead tr th {
    color: #999;
    font-size: 14px;
  }

  tbody tr td {
    position: relative;
  }

  tbody tr td.sort span,
  tbody tr td.sort img {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  tbody tr td.sort span {
    font-weight: 600;
    left: 10px;
  }

  tbody tr td.sort img {
    flex-shrink: 0;
    left: 60px;
    width: 54px;
    height: 54px;
  }

  tbody tr td span.tag {
    margin: 0 5px;
    flex-shrink: 0;
    font-size: 15px;
    color: #e6b86d;
    cursor: pointer;
    font-size: 12px;
    padding: 1px 2px;
    border: 1px solid #e6b86d;
    border-radius: 4px;
  }
  tbody tr td span.mv {
    margin-left: 5px;
    flex-shrink: 0;
    font-size: 12px;
    padding: 1px 3px;
    border-radius: 5px;
    font-weight: 400;
    cursor: pointer;
    color: var(--color-default);
    background-color: #666;
  }

  tbody tr td .op-btn {
    cursor: pointer;
    display: none;
    transition: all 233ms;
  }

  tbody tr td .op-btn i.iconfont + i.iconfont {
    font-size: 16px;
    margin-left: 24px;
  }

  tbody tr:hover td span.dt {
    display: none;
    transition: all 233ms;
  }

  tbody tr:hover td .op-btn {
    display: inline-block;
    transition: all 233ms;
  }
}

</style>
