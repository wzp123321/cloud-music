<template>
  <teleport to="body">
    <transition name="cm-settings">
      <div v-if="setting.panelOpen" class="cm-settings" @click.self="setting.closePanel">
        <aside class="cm-settings--panel">
          <header class="cm-settings--head">
            <h2>{{ tabTitle }}</h2>
            <cm-icon name="icon-Close" title="关闭" @click="setting.closePanel"></cm-icon>
          </header>

          <div class="cm-settings--body">
            <!-- 外观 -->
            <section class="cm-settings--group">
              <h3>外观</h3>
              <div class="seg">
                <button
                  v-for="item in themeOptions"
                  :key="item.value"
                  type="button"
                  :class="['seg--btn', { active: setting.theme === item.value }]"
                  @click="setting.setTheme(item.value)"
                >
                  {{ item.label }}
                </button>
              </div>
            </section>

            <!-- 音质 -->
            <section class="cm-settings--group">
              <h3>音质</h3>
              <ul class="level-list">
                <li
                  v-for="item in audioLevelOptions"
                  :key="item.value"
                  :class="['level-item', { active: setting.audioLevel === item.value }]"
                  @click="chooseLevel(item)"
                >
                  <div class="level-item--main">
                    <span class="level-item--label">{{ item.label }}</span>
                    <span class="level-item--desc">{{ item.desc }}</span>
                  </div>
                  <span v-if="setting.audioLevel === item.value" class="level-item--using">使用中</span>
                </li>
              </ul>
              <p class="cm-settings--tip">切换后对下一首生效，正在播放的歌曲不中断</p>
            </section>

            <!-- 快捷键 -->
            <section class="cm-settings--group">
              <h3>快捷键</h3>
              <ul class="shortcut-list">
                <li v-for="item in shortcuts" :key="item.desc">
                  <span class="shortcut-desc">{{ item.desc }}</span>
                  <span class="shortcut-keys">
                    <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
                  </span>
                </li>
              </ul>
              <p class="cm-settings--tip">在输入框内输入时快捷键不生效，避免打断打字</p>
            </section>
          </div>
        </aside>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';

import { usePlayerStore } from '@/store/player';
import { usePlaylistStore } from '@/store/playlist';
import {
  audioLevelOptions,
  themeOptions,
  useSettingStore,
  type AudioLevelOption,
} from '@/store/setting';
import message from '@/utils/message';

defineOptions({ name: 'CmSettings' });

const setting = useSettingStore();
const player = usePlayerStore();
const playlist = usePlaylistStore();

const tabTitle = computed(() => (setting.panelTab === 'shortcut' ? '快捷键' : '设置'));

const shortcuts = [
  { keys: ['空格'], desc: '播放 / 暂停' },
  { keys: ['←'], desc: '上一首' },
  { keys: ['→'], desc: '下一首' },
  { keys: ['↑', '↓'], desc: '音量 +5% / -5%' },
  { keys: ['M'], desc: '静音 / 取消静音' },
  { keys: ['?'], desc: '打开设置与快捷键面板' },
  { keys: ['Esc'], desc: '关闭面板' },
];

const chooseLevel = (item: AudioLevelOption) => {
  if (item.value === setting.audioLevel) {
    return;
  }
  setting.setAudioLevel(item.value);
  // 旧 url 是旧码率的限时地址，置空让下次播放按新音质重拉；当前播放项跳过，避免中断
  playlist.invalidateUrls(player.currentMusic.id);
  message.success(`已切换为「${item.label}」，下一首生效`);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && setting.panelOpen) {
    setting.closePanel();
  }
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<style lang="less" scoped>
.cm-settings {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  justify-content: flex-end;
  background: rgb(0 0 0 / 42%);
  backdrop-filter: blur(2px);

  &--panel {
    display: flex;
    flex-direction: column;
    width: 380px;
    max-width: 100vw;
    height: 100%;
    background: var(--color-default);
    border-left: 1px solid var(--color-text-border);
    box-shadow: var(--shadow-lg);
  }

  &--head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--color-text-divider);

    h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-title);
    }

    .iconfont {
      font-size: 18px;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: color 233ms;

      &:hover {
        color: var(--color-primary);
      }
    }
  }

  &--body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 24px 28px;
  }

  &--group {
    padding: 18px 0;
    border-bottom: 1px solid var(--color-text-divider);

    &:last-child {
      border-bottom: none;
    }

    h3 {
      margin-bottom: 12px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--color-text-secondary);
    }
  }

  &--tip {
    margin-top: 10px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-text-disable);
  }
}

// 主题分段控件
.seg {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--color-text-background);
  border-radius: var(--radius-sm);

  &--btn {
    flex: 1;
    height: 32px;
    font-size: 14px;
    color: var(--color-text-primary);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 3px;
    transition: all 233ms;

    &:hover {
      color: var(--color-primary);
    }

    &.active {
      font-weight: 600;
      color: var(--color-default);
      background: var(--color-primary);
    }
  }
}

// 音质单选
.level-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.level-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 233ms;

  &:hover {
    background: var(--color-hover);
  }

  &.active {
    background: var(--color-active);

    .level-item--label {
      font-weight: 600;
      color: var(--color-primary);
    }
  }

  &--main {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &--label {
    font-size: 14px;
    color: var(--color-text-title);
  }

  &--desc {
    font-size: 12px;
    color: var(--color-text-disable);
  }

  .iconfont {
    font-size: 14px;
    color: var(--color-primary);
  }

  &--using {
    padding: 2px 8px;
    font-size: 11px;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    border-radius: 10px;
  }
}

// 快捷键表
.shortcut-list {
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 13px;
    color: var(--color-text-primary);
  }

  .shortcut-keys {
    display: flex;
    gap: 4px;
  }

  kbd {
    min-width: 24px;
    padding: 2px 6px;
    font-family: inherit;
    font-size: 12px;
    text-align: center;
    color: var(--color-text-title);
    background: var(--color-text-background);
    border: 1px solid var(--color-text-border);
    border-radius: 3px;
  }
}

.cm-settings-enter-active,
.cm-settings-leave-active {
  transition: opacity 233ms;

  .cm-settings--panel {
    transition: transform 233ms ease;
  }
}

.cm-settings-enter-from,
.cm-settings-leave-to {
  opacity: 0;

  .cm-settings--panel {
    transform: translateX(100%);
  }
}
</style>
