<template>
  <div id="play-list" :class="['play-list', playing ? 'playing' : '']">
    <!-- 当前播放的音乐封面 -->
    <el-popover
      :teleported="true"
      placement="top-start"
      popper-class="pl-poppver"
      title="播放列表"
      :width="400"
      :show-arrow="false"
      trigger="hover"
    >
      <template #reference>
        <div class="pl-poppver-trigger">
          <i class="iconfont icon-yinleyule" title="播放列表"></i>
        </div>
      </template>
      <table v-if="playList.musicList?.length" scroll-y>
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
          <tr v-for="(item, index) in playList.musicList" :key="item.id ?? index">
            <td style="width: 40px">{{ index + 0 }}</td>
            <td style="max-width: 100px">{{ item.name }}</td>
            <td>{{ item.artist }}</td>
            <td>{{ item.alName }}</td>
            <td>
              <i title="播放" class="iconfont icon-24gf-play" @click="handlePlay(item)"></i>
              <i title="删除" class="iconfont icon-Close" @click="playList.removeMusic(item.id)"></i>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="common-table__empty flex-column-center-center">
        <img src="../../../../assets/images/common/common-data-none.svg" alt="" />
        <p>暂无数据</p>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { usePlaylistStore } from '@/stores/playlist';
import { usePlayerStore } from '@/stores/player';
import { PL_IPlayVO } from './play-list.api';

const playList = usePlaylistStore();
const player = usePlayerStore();
const playing = computed(() => {
  return player.isPlaying;
});

const handlePlay = (item: PL_IPlayVO) => {
  player.play(item);
};
</script>

<style scoped lang="less">
#play-list {
  position: fixed;
  bottom: 100px;
  right: 48px;

  i.iconfont.icon-yinleyule {
    cursor: pointer;
    font-size: 32px;
  }

  &.playing {
    .pl-poppver-trigger {
      animation-name: play_rotate;
      animation-duration: 2s;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
  }
}

@keyframes play_rotate {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
<style lang="less">
.pl-poppver.el-popper {
  overflow: hidden;
  z-index: 9999 !important;

  table {
    width: 100%;

    thead tr {
      th {
        padding-left: 0;
        padding-right: 0;

        text-align: center;
      }
    }

    tbody tr {
      td {
        cursor: pointer;
        height: 40px;
        line-height: 40px;

        text-align: center;

        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
