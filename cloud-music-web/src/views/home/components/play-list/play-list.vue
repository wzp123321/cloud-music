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
      <ul v-if="playList.musicList?.length">
        <li v-for="(item, index) in playList.musicList" :key="'playlist_' + index">
          <span class="sort mr8">{{ index + 1 }}</span>
          <span class="name m8" :title="item.name">{{ item.name }}</span>
          <span class="artist">{{ item.artist }}</span>
          <div class="btn">
            <i title="播放" class="iconfont icon-24gf-play" @click="handlePlay(item)"></i>
            <i title="删除" class="iconfont icon-Close" @click="playList.removeMusic(item.id)"></i>
          </div>
        </li>
      </ul>
      <div class="common-table__empty flex-column-center-center" v-else>
        <img src="../../../../assets/images/common/common-data-none.svg" alt="" />
        <p>暂无数据</p>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import playListService from './play-list.service';
import player from '../play-controller/play-controller.service';
import { PL_IPlayVO } from './play-list.api';

const playList = playListService;
const playing = computed(() => {
  return player?.is_playing;
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

  .pl-poppver {
    overflow: hidden;

    ul {
      max-height: 320px;
      min-height: 166px;

      overflow-y: auto;

      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 7px 6px;

        span {
          display: inline-block;
          color: var(--color-text-primary);
          font-size: 14px;

          line-height: 22px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        span.sort {
          width: 22px;
          text-align: center;
        }

        span.name {
          width: 160px;
          text-align: center;
        }

        span.artist {
          width: 100px;
          text-align: center;
        }

        i {
          display: inline-block;
          font-size: 14px;
        }

        div.btn {
          display: flex;
          align-items: center;

          i + i {
            margin-left: 10px;
          }
        }

        &:hover {
          cursor: pointer;
          background-color: rgba(0, 0, 0, 0.08);
          transition: all 233ms;
        }
      }
    }
  }

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
