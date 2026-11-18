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
      trigger="click"
      :persistent="false"
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
      <div v-else class="common-table-empty flex-column-center-center">
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
import { PL_PlayVO } from '../../../../apis/play-list/index.api';

const playList = usePlaylistStore();
const player = usePlayerStore();
const playing = computed(() => {
  return player.isPlaying;
});

const handlePlay = (item: PL_PlayVO) => {
  player.play(item);
};
</script>

<style scoped lang="less">
#play-list {
  position: fixed;
  bottom: 116px;
  right: 48px;
  z-index: 100;

  i.iconfont.icon-yinleyule {
    cursor: pointer;
    font-size: 32px;
  }

  .pl-poppver-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border: 1px solid rgb(255 255 255 / 60%);
    border-radius: 50%;
    background: rgb(255 255 255 / 78%);
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(8px);
    transition: transform var(--param-transition-time), box-shadow var(--param-transition-time);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .iconfont {
      color: var(--color-primary);
      font-size: 26px;
    }
  }

  &.playing .pl-poppver-trigger {
    border-color: var(--color-primary);

    .iconfont {
      animation: play_rotate 4s linear infinite;
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
  padding: 12px;
  border: 1px solid var(--color-text-divider);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg) !important;

  .el-popper__arrow {
    display: none;
  }

  .common-table-empty {
    height: 140px;
  }
}
</style>
