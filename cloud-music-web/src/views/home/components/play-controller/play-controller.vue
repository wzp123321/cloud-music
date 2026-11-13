<template>
<div :class="{'play-controller': true, 'locked' : locked}">
  <div class="control">
    <div class="control-panel flex-row-justify-center">
      <div class="playing flex-row-start-center">
        <!-- 头像 -->
        <cm-image
          v-if="player.currentMusic.picUrl"
          :src="player.currentMusic.picUrl"
          alt=""
          class="np-cover"
          @click="linkToDetail"
        />
        <cm-image
          v-else
          src="../../../../assets/images/common/common-avatar-default.png"
          alt=""
          class="np-cover"
          @click="linkToDetail"
        />
        <!-- 进度 -->
        <div class="progress ml20 flex-coulmn">
          <!-- 音乐播放器：元素由组件注入 player store -->
          <cm-audio
            ref="audioElement"
            :src="player.currentMusic.url || undefined"
            @timeupdate="player.onTimeUpdate"
            @ended="player.onEnded('next')"
            @error="player.onError"
          ></cm-audio>

          <div class="flex-row-justify-center mb8">
            <span class="np-song" @click="linkToDetail">{{ player.currentMusic.name ? player.currentMusic.name : '云音乐' }}</span>
            <div>
              <span>{{ formatDuration(player.playTimestamp) }}</span> /
              <span>{{ formatDuration(player.currentMusic.dt) }}</span>
            </div>
          </div>
          <el-slider
            v-model="player.progress"
            :show-tooltip="false"
            @change="player.seek"
            @mousedown="player.startDragging"
            @mouseup="player.endDragging"
          />
        </div>
        <!-- 歌词 -->
        <div v-show="lyric.lrcList?.length" class="lrc-list">
          <!-- 歌词由 LRC 解析后拼 <br>，属本地生成内容 -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="sanitizeHtml(lyric.showLyc)"></p>
        </div>
      </div>

      <div class="switch flex-row-start-center">
        <cm-icon name="icon-shangyishou" title="上一首" @click="player.onEnded('preview')"></cm-icon>
        <cm-icon
          :name="player.isPlaying ? 'icon-zanting' : 'icon-24gl-playCircle'"
          :title="player.isPlaying ? '暂停' : '播放'"
          @click="player.switchPlayStatus"
        ></cm-icon>
        <cm-icon name="icon-xiayishou" title="下一首" @click="player.onEnded('next')"></cm-icon>
      </div>

      <div class="operate-btn flex-row-start-center">
        <cm-icon name="icon-jushoucang" title="收藏"></cm-icon>
        <cm-icon name="icon-xiazai" title="下载" @click="player.downloadMusic"></cm-icon>
        <cm-icon
          v-for="(item, index) in Object.keys(player.playTypes)"
          v-show="player.playTypeIndex%Object.keys(player.playTypes).length === index"
          :key="item"
          :name="player.playTypes[item]"
          :title="item"
          @click="player.switchPlayType"
        ></cm-icon>
        <cm-icon
          class="mr6"
          :name="player.isMute ? 'icon-jingyin' : 'icon-24gl-volumeMiddle'"
          @click="player.switchIsMute"
        ></cm-icon>
        <el-slider v-model="player.volume" :show-tooltip="false" @change="player.setVolume" />
      </div>

      <span class="lock-switch" @click="handleLockorNot">
        <cm-icon :name="locked ? 'icon-jiesuo' : 'icon-jiesuo1'"></cm-icon>
      </span>
    </div>
  </div>
</div>

</template>

<script setup lang="ts">

// 底部音乐播放
import { onMounted, ref } from 'vue';
import { ElSlider } from 'element-plus';
import { useRouter } from 'vue-router';

import { usePlayerStore } from '@/store/player';
import { useLyricStore } from '@/store/lyric';
import { formatDuration } from '@/core/utils';
import { sanitizeHtml } from '@/utils/sanitize';
// 局部同步引入：避免全局异步组件尚未挂载时 onMounted 拿不到 audio DOM
import CmAudio from '@/components/cm-audio/cm-audio.vue';
defineOptions({ name: 'PlayController' });
const player = usePlayerStore();
    const lyric = useLyricStore();
    const router = useRouter();
    const locked = ref<boolean>(true);
    const audioElement = ref<InstanceType<typeof CmAudio> | null>(null);

    // 点击正在播放的歌曲 → 歌曲详情页
    const linkToDetail = () => {
      const id = player.currentMusic.id;
      if (id) {
        router.push({ path: '/music_detail', query: { id: String(id) } });
      }
    };

    // 锁定与否
    const handleLockorNot = () => {
      locked.value = !locked.value;
    };

    onMounted(() => {
      // 把 audio 原生 DOM 注入 player store，播放控制统一由 store action 驱动
      player.bindAudio(audioElement.value?.el ?? null);
    });

    ;
</script>

<style lang="less" scoped>
.play-controller {
  cursor: pointer;
  z-index: 99;
  position: fixed;
  bottom: -56px;
  left: 0;
  width: 100%;
  padding-top: 20px;
  transition: all 233ms;

  &.locked {
    bottom: 0;
  }

  .control {
    position: relative;
    height: 56px;
    background-color: var(--color-default);
    box-shadow: 0 0 20px 0 rgb(0 0 0 / 10%);

    &-panel {
      position: relative;
      max-width: 1200px;
      width: 100%;
      box-sizing: border-box;
      margin: 0 auto;
      padding-left: 24px;
      padding-right: 24px;

      .lock-switch {
        position: absolute;
        top: -25px;
        right: 0;
        background-color: var(--color-default);
        border-radius: 50%;
        width: 54px;
        height: 54px;
        text-align: center;
        z-index: 0;
      }

      .lock-switch .iconfont {
        position: relative;
        font-size: 16px;
        top: 8px;
      }

      .playing,
      .switch,
      .operate-btn {
        position: relative;
        height: 56px;
        color: var(--color-text-primary);
        z-index: 999;
      }

      // 播放区
      .playing .progress {
        flex: 1 1 auto;
      }

      .playing .lrc-list {
        position: absolute;
        top: 50%;
        left: 420px;
        width: 240px;
        white-space: nowrap;
        transform: translateY(-50%);

        p {
          font-size: 14px;
          transform: translateY(0);
          transition: all 233ms;

          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .playing .progress span {
        height: 22px;
        line-height: 22px;
        font-size: 14px;
      }

      .playing {
        width: 360px;

        img {
          width: 64px;
          height: 56px;
        }

        .np-cover {
          cursor: pointer;
          border-radius: 4px;
        }
      }

      .playing .progress .np-song {
        cursor: pointer;

        &:hover {
          color: var(--color-primary, #c20c0c);
        }
      }

      .operate-btn > .el-slider {
        width: 80px;
      }

      .playing .progress :deep(.el-slider),
      .operate-btn :deep(.el-slider) {
        height: auto !important;

        .el-slider__bar {
          height: 3px;
          background-color: var(--color-primary) !important;
        }

        .el-slider__runway {
          height: 3px;
        }

        .el-slider__button-wrapper {
          top: -8px !important;
        }

        .el-slider__button-wrapper,
        .el-slider__button-wrapper .el-slider__button {
          width: 12px !important;
          height: 12px !important;
        }

        .el-slider__button-wrapper .el-slider__button {
          background-color: var(--color-primary);
          border: 4px solid var(--color-default);
        }
      }

      // 切换区
      .switch {
        .iconfont {
          font-size: 24px;
        }

        .iconfont.icon-24gl-playCircle,
        .iconfont.icon-zanting {
          font-size: 36px;
          margin: 0 12px;
        }
      }

      // 操作区
      .operate-btn {
        .iconfont {
          font-size: 16px;
        }

        .iconfont + .iconfont {
          z-index: 11;
          margin-left: 8px;
        }
      }
    }
  }

  &:hover {
    bottom: 0;
    transition: all 233ms;
  }
}

</style>
