<template>
  <div :class="['play-list', playing ? 'playing' : '']" id="play-list">
    <!-- 当前播放的音乐封面 -->
    <el-popover
      :teleported="false"
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
      <ul>
        <li v-for="(item, index) in playList.musicList" :key="'playlist_' + index">
          <span class="sort mr8">{{ index + 1 }}</span>
          <span class="name w100" :title="item.name">{{ item.name }}</span>
          <span>{{ item.artist }}</span>
        </li>
      </ul>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import playListService from './play-list.service';
import Player from '../play-controller/play-controller.service';

const playList = playListService;
const playing = computed(() => {
  return Player?.is_playing;
});
</script>

<style scoped lang="less">
#play-list {
  position: fixed;
  bottom: 100px;
  right: 48px;

  .pl-poppver {
    overflow: hidden;

    ul {
      max-height: 320px;

      overflow-y: auto;

      li {
        display: flex;
        align-items: center;
        padding: 4px 0;

        span {
          display: inline-block;
          color: var(--color-text-primary);
          font-size: 14px;

          line-height: 22px;
        }

        span.sort {
          width: 22px;
          text-align: center;
        }

        span.name {
          width: 100px;
          text-align: left;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        &:hover {
          cursor: pointer;
          background-color: rgba(0, 0, 0, 0.08);
          transition: all 233ms;
        }
      }
    }
  }

  i.iconfont {
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
