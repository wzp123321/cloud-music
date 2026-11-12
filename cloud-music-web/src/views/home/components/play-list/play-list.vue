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
          <cm-icon name="icon-yinleyule" title="播放列表"></cm-icon>
        </div>
      </template>
      <cm-playlist-table
        v-if="playList.musicList?.length"
        :list="playList.musicList"
        @play="handlePlay"
        @remove="playList.removeMusic"
      />
      <div v-else class="common-table__empty flex-column-center-center">
        <cm-image src="../../../../assets/images/common/common-data-none.svg" alt="" />
        <p>暂无数据</p>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { usePlaylistStore } from '@/store/playlist';
import { usePlayerStore } from '@/store/player';
import { PL_IPlayVO } from '../../../../apis/play-list/index.api';

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
}
</style>
