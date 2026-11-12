<template>
  <div id="music-detail" class="music-detail">
    <!-- 模糊封面背景 -->
    <div
      class="md-bg"
      :style="{ backgroundImage: `url(${coverBg})` }"
    ></div>
    <div class="md-mask"></div>

    <!-- 顶部栏 -->
    <header class="md-header">
      <cm-icon name="icon-fanhui" title="返回" @click="goBack"></cm-icon>
      <div class="md-head-title">
        <span class="t-name">{{ player.currentMusic.name || '云音乐' }}</span>
        <span class="t-artist"> - {{ player.currentMusic.artist || '未知歌手' }}</span>
      </div>
    </header>

    <!-- 主体：左唱片 / 右歌词 -->
    <main class="md-main">
      <section class="md-disc-wrap">
        <div class="tonearm" :class="{ playing: player.isPlaying }"></div>
        <div class="disc" :class="{ playing: player.isPlaying }">
          <div class="disc-inner">
            <cm-image :src="cover" class="disc-cover" alt="" />
          </div>
        </div>
      </section>

      <section class="md-right">
        <div class="md-right-head">
          <div class="md-meta">
            <h2 class="md-title">{{ player.currentMusic.name || '云音乐' }}</h2>
            <div class="md-sub">
              <span class="md-sub-item">
                <label>专辑：</label>{{ player.currentMusic.alName || '未知' }}
              </span>
              <span class="md-sub-item">
                <label>歌手：</label>{{ player.currentMusic.artist || '未知' }}
              </span>
            </div>
          </div>
          <cm-button class="md-toggle" @click="togglePanel">
            <cm-icon name="icon-xiangqing"></cm-icon>
            {{ showLyric ? '歌曲详情' : '歌词' }}
          </cm-button>
        </div>

        <!-- 歌词 -->
        <div v-show="showLyric" ref="lyricsBox" class="md-lyrics">
          <p
            v-for="(line, i) in lyric.lrcList"
            :key="i"
            :ref="(el) => setLineRef(el, i)"
            :class="['lyric-line', { active: i === lyric.activeIndex }]"
            @click="seekToLine(line)"
          >
            {{ line.lyc || '♪' }}
          </p>
          <p v-if="!lyric.lrcList.length" class="lyric-empty">纯音乐，请欣赏</p>
        </div>

        <!-- 歌曲详情（评论 + 相似） -->
        <div v-show="!showLyric" class="md-detail">
          <cm-comment :id="detailId" type="music"></cm-comment>
          <cm-simi :id="detailId" type="song"></cm-simi>
          <cm-simi :id="detailId" type="user"></cm-simi>
        </div>
      </section>
    </main>

    <!-- 底部控制条 -->
    <footer class="md-footer">
      <div class="md-progress">
        <span class="md-time">{{ formatDuration(player.playTimestamp) }}</span>
        <el-slider
          v-model="player.progress"
          :show-tooltip="false"
          class="md-slider"
          @mousedown="player.startDragging"
          @mouseup="player.endDragging"
          @change="player.seek"
        />
        <span class="md-time">{{ formatDuration(player.currentMusic.dt) }}</span>
      </div>

      <div class="md-controls">
        <div class="ctrl-side ctrl-left">
          <cm-icon name="icon-jushoucang" title="收藏"></cm-icon>
          <cm-icon name="icon-xiazai" title="下载" @click="player.downloadMusic"></cm-icon>
        </div>

        <div class="ctrl-center">
          <cm-icon name="icon-shangyishou" title="上一首" @click="player.switchMusic('preview')"></cm-icon>
          <cm-icon
            class="play-btn"
            :name="player.isPlaying ? 'icon-zanting' : 'icon-24gl-playCircle'"
            :title="player.isPlaying ? '暂停' : '播放'"
            @click="player.switchPlayStatus"
          ></cm-icon>
          <cm-icon name="icon-xiayishou" title="下一首" @click="player.switchMusic('next')"></cm-icon>
        </div>

        <div class="ctrl-side ctrl-right">
          <cm-icon
            :name="player.playTypes[playModeKey]"
            :title="playModeKey"
            @click="player.switchPlayType"
          ></cm-icon>
          <cm-icon
            :name="player.isMute ? 'icon-jingyin' : 'icon-24gl-volumeMiddle'"
            title="音量"
            @click="player.switchIsMute"
          ></cm-icon>
          <el-slider
            v-model="player.volume"
            :show-tooltip="false"
            class="md-vol"
            @change="player.setVolume"
          />
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElSlider } from 'element-plus';

import { usePlayerStore } from '@/store/player';
import { useLyricStore } from '@/store/lyric';
import { formatDuration } from '@/core/utils';
import defaultCover from '@/assets/images/common/common-avatar-default.png';

const player = usePlayerStore();
const lyric = useLyricStore();
const route = useRoute();
const router = useRouter();

const showLyric = ref(true);
const lyricsBox = ref<HTMLElement | null>(null);
const lineEls: HTMLElement[] = [];

const setLineRef = (el: any, i: number) => {
  if (el) lineEls[i] = el as HTMLElement;
};

const togglePanel = () => {
  showLyric.value = !showLyric.value;
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

/** 封面：优先当前歌曲封面，缺省回退默认图 */
const cover = computed(
  () => player.currentMusic.picUrl || defaultCover,
);
/** 背景模糊图（用更大尺寸的封面） */
const coverBg = computed(() => player.currentMusic.picUrl || defaultCover);

/** 详情页所需的歌曲 id：路由优先，回退到当前播放歌曲 */
const detailId = computed<number>(() => {
  const q = Number(route.query.id);
  return q || player.currentMusic.id || 0;
});

/** 当前播放模式 key（用于映射图标） */
const playModeKey = computed(() => {
  const keys = Object.keys(player.playTypes);
  return keys[player.playTypeIndex % keys.length];
});

/** 点击歌词行 → 跳转到该行时间 */
const seekToLine = (line: { time: number; lyc: string }) => {
  if (line && typeof line.time === 'number') {
    player.seekTo(line.time);
  }
};

/** 当前歌词行变化时，把该行滚动到歌词区中央 */
watch(
  () => lyric.activeIndex,
  (i) => {
    const box = lyricsBox.value;
    const el = lineEls[i];
    if (!box || !el) {
      return;
    }
    const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
    box.scrollTo({ top, behavior: 'smooth' });
  },
);
</script>

<style lang="less" scoped>
.music-detail {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: hidden;
  color: #fff;
  background: #1a1a1a;

  // 模糊背景
  .md-bg {
    position: absolute;
    inset: -60px;
    background-size: cover;
    background-position: center;
    filter: blur(60px) brightness(0.55);
    transform: scale(1.2);
  }

  .md-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
  }

  // 顶部栏
  .md-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 28px;

    .iconfont {
      font-size: 24px;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: var(--color-primary, #c20c0c);
      }
    }

    .md-head-title {
      margin-left: 18px;
      font-size: 15px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .t-name {
        font-weight: 600;
      }

      .t-artist {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  // 主体
  .md-main {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 80px;
    height: calc(100% - 64px - 150px);
    padding: 0 40px;
  }

  // 唱片
  .md-disc-wrap {
    position: relative;
    flex-shrink: 0;
    width: 320px;
    height: 320px;
  }

  // 唱针支点在唱片右上方：静止时向右外摆离开唱片，播放时垂直落下搭在唱片上
  .tonearm {
    position: absolute;
    top: -36px;
    left: calc(50% + 70px);
    z-index: 4;
    width: 22px;
    height: 150px;
    background: linear-gradient(180deg, #ddd 0%, #999 55%, #555 100%);
    border-radius: 6px;
    transform-origin: top center;
    transform: rotate(35deg);
    transition: transform 0.5s ease;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);

    &::after {
      content: '';
      position: absolute;
      bottom: -7px;
      left: 50%;
      width: 20px;
      height: 20px;
      background: #333;
      border-radius: 50%;
      transform: translateX(-50%);
    }

    &.playing {
      transform: rotate(0deg);
    }
  }

  .disc {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at center, #3a3a3a 0 30%, #0c0c0c 31% 100%);
    box-shadow:
      0 0 0 6px rgba(255, 255, 255, 0.04),
      0 20px 60px rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: md-spin 24s linear infinite;
    animation-play-state: paused;

    &.playing {
      animation-play-state: running;
    }
  }

  .disc-inner {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    border: 5px solid rgba(255, 255, 255, 0.08);
    background: #222;
  }

  .disc-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @keyframes md-spin {
    to {
      transform: rotate(360deg);
    }
  }

  // 右侧
  .md-right {
    display: flex;
    flex-direction: column;
    width: 460px;
    max-width: 46vw;
    height: 100%;
    padding: 10px 0;
  }

  .md-right-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .md-title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #fff;
  }

  .md-sub {
    margin-top: 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);

    .md-sub-item + .md-sub-item {
      margin-left: 20px;
    }

    label {
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .md-toggle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    .iconfont {
      margin-right: 4px;
      font-size: 14px;
    }

    &:hover {
      border-color: #fff;
      color: #fff;
    }
  }

  // 歌词
  .md-lyrics {
    // 必须建立定位上下文：否则行的 offsetTop 会相对 fixed 的全屏容器计算，滚动定位失效
    position: relative;
    flex: 1;
    overflow-y: auto;
    // 上下留足半屏空白，保证首行/末行也能滚到容器正中
    padding: 300px 0;
    scroll-behavior: smooth;
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 18%,
      #000 82%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 18%,
      #000 82%,
      transparent 100%
    );

    &::-webkit-scrollbar {
      width: 0;
    }
  }

  .lyric-line {
    margin: 0;
    padding: 11px 0;
    font-size: 15px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.45);
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      color: rgba(255, 255, 255, 0.75);
    }

    &.active {
      font-size: 19px;
      font-weight: 600;
      color: #fff;
    }
  }

  .lyric-empty {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
  }

  // 评论/相似组件按浅色主题设计，套一层浅色卡片保证在深色播放页上可读
  .md-detail {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    color: #333;
  }

  // 底部控制条
  .md-footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    padding: 14px 40px 22px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  }

  .md-progress {
    display: flex;
    align-items: center;
    gap: 14px;
    max-width: 1100px;
    margin: 0 auto 10px;
  }

  .md-time {
    width: 44px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    flex-shrink: 0;
  }

  .md-slider {
    flex: 1;
  }

  .md-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1100px;
    margin: 0 auto;
  }

  .ctrl-side {
    display: flex;
    align-items: center;
    gap: 18px;
    width: 220px;

    &.ctrl-right {
      justify-content: flex-end;
    }
  }

  .ctrl-center {
    display: flex;
    align-items: center;
    gap: 26px;
  }

  .ctrl-side .iconfont {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #fff;
    }
  }

  .ctrl-center .iconfont {
    font-size: 26px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
  }

  .play-btn {
    font-size: 52px !important;
    color: #fff !important;
    transition: transform 0.15s;

    &:hover {
      transform: scale(1.06);
    }
  }

  .md-vol {
    width: 90px;
  }

  // 滑块主题（进度 + 音量）
  .md-slider,
  .md-vol {
    :deep(.el-slider__bar) {
      height: 3px;
      background-color: var(--color-primary, #c20c0c) !important;
    }

    :deep(.el-slider__runway) {
      height: 3px;
      background-color: rgba(255, 255, 255, 0.25);
    }

    :deep(.el-slider__button-wrapper) {
      top: -8px !important;
    }

    :deep(.el-slider__button-wrapper),
    :deep(.el-slider__button-wrapper .el-slider__button) {
      width: 12px !important;
      height: 12px !important;
    }

    :deep(.el-slider__button-wrapper .el-slider__button) {
      background-color: #fff;
      border: 3px solid var(--color-primary, #c20c0c);
    }
  }
}
</style>
