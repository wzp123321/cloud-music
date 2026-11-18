<template>
  <div :class="{ 'play-controller': true, locked: locked }">
    <div class="control" :class="{ 'is-playing': player.isPlaying }">
      <div class="control-panel flex-row-justify-center">
        <div class="playing flex-row-start-center">
          <!-- 头像 -->
          <div class="np-cover-wrap" :class="{ 'is-playing': player.isPlaying }">
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
            <!-- 起播瞬间的音符飞散：沿贝塞尔曲线抛出；播放中持续低频飘出 -->
            <cm-play-fx :trigger="fxTrigger" :active="player.isPlaying" />
          </div>
          <!-- 进度 -->
          <div class="progress ml20 flex-coulmn">
            <!-- 音乐播放器：元素由组件注入 player store -->
            <cm-audio
              ref="audioElement"
              :src="player.currentMusic.url || undefined"
              @timeupdate="player.onTimeUpdate"
              @loadedmetadata="player.onLoadedMetadata"
              @ended="player.onEnded('next')"
              @error="player.onError"
            ></cm-audio>

            <div class="flex-row-justify-center mb8">
              <!-- 音浪与歌名同组，否则 space-between 会把音浪甩到最左 -->
              <span class="np-title">
                <span v-show="player.isPlaying" class="playing-wave" aria-hidden="true">
                  <span v-for="i in 4" :key="i" :style="{ animationDelay: (i - 1) * 0.13 + 's' }"></span>
                </span>
                <span class="np-song" @click="linkToDetail">{{
                  player.currentMusic.name ? player.currentMusic.name : '云音乐'
                }}</span>
              </span>
              <div>
                <span>{{ formatDuration(player.playTimestamp) }}</span> /
                <span>{{ formatDuration(player.displayDuration) }}</span>
              </div>
            </div>
            <el-slider
              v-model="player.progress"
              :show-tooltip="false"
              @change="player.seek"
              @pointerdown="player.startDragging"
              @pointerup="player.endDragging"
              @pointercancel="player.endDragging"
            />
          </div>
          <!-- 歌词 -->
          <div v-show="lyric.lrcList?.length" class="lrc-list">
            <p>
              <cm-lyric-line :text="lyric.showLyc" :progress="lineProgress" :base-opacity="0.35" />
            </p>
          </div>
        </div>

        <div class="switch flex-row-start-center">
          <!-- 手动切歌直接按队列顺序走；播放模式（单曲循环/随机）只约束 @ended 的自然结束 -->
          <cm-icon name="icon-shangyishou" title="上一首" @click="player.switchMusic('preview', true)"></cm-icon>
          <cm-icon
            :name="player.isPlaying ? 'icon-zanting' : 'icon-24gl-playCircle'"
            :title="player.isPlaying ? '暂停' : '播放'"
            @click="player.switchPlayStatus"
          ></cm-icon>
          <cm-icon name="icon-xiayishou" title="下一首" @click="player.switchMusic('next', true)"></cm-icon>
        </div>

        <div class="operate-btn flex-row-start-center">
          <button
            class="rate-btn"
            :title="'播放倍速：' + player.playbackRate + 'x（点击切换）'"
            @click="player.switchPlaybackRate"
          >
            {{ player.playbackRate }}x
          </button>
          <cm-icon
            name="icon-jushoucang"
            :title="player.likedIds.includes(player.currentMusic.id) ? '取消收藏' : '收藏'"
            :class="{ 'is-liked': player.likedIds.includes(player.currentMusic.id) }"
            @click="player.toggleLike"
          ></cm-icon>
          <cm-icon name="icon-xiazai" title="下载" @click="player.downloadMusic"></cm-icon>
          <cm-icon
            v-for="(item, index) in Object.keys(player.playTypes)"
            v-show="player.playTypeIndex % Object.keys(player.playTypes).length === index"
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
    <!-- 列表点歌时从鼠标位置飞向封面的特效容器（fixed 全屏，跟随播放器常驻） -->
    <cm-fly-ball></cm-fly-ball>
  </div>
</template>

<script setup lang="ts">
// 底部音乐播放
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { ElSlider } from 'element-plus';
import { useRouter } from 'vue-router';

import { usePlayerStore } from '@/store/player';
import { useLyricStore } from '@/store/lyric';
import { useSettingStore } from '@/store/setting';
import { useLyricProgress } from '@/composables/useLyricProgress';
import { formatDuration } from '@/core/utils';
// 局部同步引入：避免全局异步组件尚未挂载时 onMounted 拿不到 audio DOM
import CmAudio from '@/components/cm-audio/cm-audio.vue';
import CmPlayFx from '@/components/cm-play-fx/cm-play-fx.vue';
import CmLyricLine from '@/components/cm-lyric-line/cm-lyric-line.vue';
import CmFlyBall from '@/components/cm-fly-ball/cm-fly-ball.vue';
defineOptions({ name: 'PlayController' });
const player = usePlayerStore();
const lyric = useLyricStore();
const setting = useSettingStore();
// 歌词逐字进度：rAF 读音频时间，比 timeupdate 平滑
const { progress: lineProgress } = useLyricProgress();
const router = useRouter();
const locked = ref<boolean>(true);
const audioElement = ref<InstanceType<typeof CmAudio> | null>(null);
// 起播计数器：由「暂停→播放」或「播放中换歌」递增，驱动音符飞散特效
const fxTrigger = ref(0);

watch(
  () => [player.isPlaying, player.currentMusic.id] as const,
  ([isPlaying, musicId], previous) => {
    if (!isPlaying) {
      return;
    }
    const previousPlaying = previous?.[0] ?? false;
    const previousId = previous?.[1] ?? 0;
    if (!previousPlaying || previousId !== musicId) {
      fxTrigger.value += 1;
    }
  },
);

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

// 全局播放快捷键：空格播放/暂停，左右切歌，上下调音量，M 静音，? 打开设置；
// 输入框内不拦截，避免打断打字
const handleKeydown = (e: KeyboardEvent) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const target = e.target as HTMLElement | null;
  if (target?.closest('input, textarea, [contenteditable="true"]')) return;
  // 面板打开时把键盘交给面板自己处理（Esc 关闭）
  if (setting.panelOpen) return;
  if (e.code === 'Space') {
    e.preventDefault();
    player.switchPlayStatus();
  } else if (e.code === 'ArrowLeft') {
    player.switchMusic('preview');
  } else if (e.code === 'ArrowRight') {
    player.switchMusic('next');
  } else if (e.code === 'ArrowUp') {
    e.preventDefault();
    player.adjustVolume(5);
  } else if (e.code === 'ArrowDown') {
    e.preventDefault();
    player.adjustVolume(-5);
  } else if (e.code === 'KeyM') {
    player.switchIsMute();
  } else if (e.key === '?') {
    setting.openPanel('shortcut');
  }
};

onMounted(() => {
  // 把 audio 原生 DOM 注入 player store，播放控制统一由 store action 驱动
  player.bindAudio(audioElement.value?.el ?? null);
  // 收藏状态回显：未登录时 store 内部直接跳过，不发请求
  void player.loadLikedIds();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<style lang="less" scoped>
.play-controller {
  --pc-height: 72px;
  cursor: pointer;
  z-index: 99;
  position: fixed;
  bottom: calc(-1 * var(--pc-height));
  left: 0;
  width: 100%;
  padding-top: 20px;
  transition: all 233ms;

  &.locked {
    bottom: 0;
  }

  .control {
    position: relative;
    height: var(--pc-height);
    background-color: var(--color-default);
    box-shadow: 0 -2px 20px 0 rgb(0 0 0 / 12%);

    // 播放中顶部一道缓慢横移的流光，静止时不可见
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
      background-size: 40% 100%;
      background-repeat: no-repeat;
      opacity: 0;
      transition: opacity var(--param-transition-time);
      pointer-events: none;
    }

    &.is-playing::before {
      opacity: 0.75;
      animation: control-sheen 3.6s linear infinite;
    }

    // 播放中：进度滑块带一圈品牌色柔光，暂停时回到默认
    &.is-playing .playing .progress :deep(.el-slider__button) {
      box-shadow: 0 0 6px var(--color-primary);
    }

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
        height: var(--pc-height);
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

      // 歌名前的播放音浪：选择器带上 .playing .progress 前缀，压过上面那条通用 span 规则
      .playing .progress .playing-wave span {
        width: 2px;
        height: 100%;
        border-radius: 1px;
        background: var(--color-primary);
        transform-origin: bottom;
        animation: sound-wave-bounce 820ms ease-in-out infinite alternate;
      }

      .playing .progress .playing-wave {
        display: inline-flex;
        align-items: flex-end;
        gap: 2px;
        height: 12px;
        margin-right: 6px;
        vertical-align: middle;
        line-height: 0;
      }

      .playing {
        width: 380px;

        img {
          width: 72px;
          height: 72px;
        }

        .np-cover-wrap {
          position: relative;
          flex: 0 0 auto;
          line-height: 0;

          // 播放中：封面外圈红色呼吸光，用 currentColor 承接品牌色，避免再写色值
          &.is-playing::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: var(--radius-sm) 0 0 var(--radius-sm);
            color: var(--color-primary);
            box-shadow: 0 0 0 0 currentColor;
            pointer-events: none;
            animation: cover-breathe 2.6s ease-out infinite;
          }

          // 列表点歌飞入落地：一圈红环向外扩散一次，作为"收到"的回执
          &.is-catch::before {
            content: '';
            position: absolute;
            inset: -1px;
            border: 2px solid var(--color-primary);
            border-radius: var(--radius-sm) 0 0 var(--radius-sm);
            pointer-events: none;
            animation: cover-catch 560ms ease-out;
          }
        }

        .np-cover {
          cursor: pointer;
          border-radius: var(--radius-sm) 0 0 var(--radius-sm);
        }

        // 播放中封面极轻微的呼吸缩放，幅度控制在 2% 以内，避免看着晃
        .np-cover-wrap.is-playing .np-cover {
          animation: cover-breathe-scale 2.6s ease-in-out infinite;
        }
      }

      @keyframes sound-wave-bounce {
        0% {
          transform: scaleY(0.25);
        }
        100% {
          transform: scaleY(1);
        }
      }

      @keyframes cover-catch {
        0% {
          opacity: 0.9;
          transform: scale(1);
        }

        100% {
          opacity: 0;
          transform: scale(1.4);
        }
      }

      @keyframes cover-breathe {
        0% {
          box-shadow: 0 0 0 0 currentColor;
          opacity: 0.5;
        }

        100% {
          box-shadow: 0 0 0 10px currentColor;
          opacity: 0;
        }
      }

      @keyframes cover-breathe-scale {
        0%,
        100% {
          transform: scale(1);
        }

        50% {
          transform: scale(1.02);
        }
      }

      .playing .progress .np-title {
        display: inline-flex;
        align-items: center;
        min-width: 0;
      }

      .playing .progress .np-song {
        cursor: pointer;
        overflow: hidden;
        max-width: 240px;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
          color: var(--color-primary);
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

        .rate-btn {
          margin-right: 8px;
          padding: 2px 6px;
          border: 1px solid var(--color-text-border);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--color-text-primary);
          cursor: pointer;
          font-size: var(--font-size-xs);
          line-height: 1.4;
          transition:
            color var(--param-transition-time),
            border-color var(--param-transition-time);

          &:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
          }
        }
      }
    }
  }

  &:hover {
    bottom: 0;
    transition: all 233ms;
  }
}

@keyframes control-sheen {
  0% {
    background-position: -50% 0;
  }

  100% {
    background-position: 150% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .play-controller {
    .control.is-playing::before,
    .playing .np-cover-wrap.is-playing::after,
    .playing .np-cover-wrap.is-playing .np-cover,
    .playing .progress .playing-wave span {
      animation: none;
    }
  }
}
</style>
