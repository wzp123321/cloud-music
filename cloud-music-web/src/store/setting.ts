import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

/** 与服务端 /song/url 的 level 参数一一对应 */
export type AudioLevel = 'standard' | 'higher' | 'exhigh' | 'lossless';

export interface AudioLevelOption {
  value: AudioLevel;
  label: string;
  desc: string;
}

export const audioLevelOptions: AudioLevelOption[] = [
  { value: 'standard', label: '标准', desc: '128kbps' },
  { value: 'higher', label: '较高', desc: '192kbps' },
  { value: 'exhigh', label: '极高', desc: '320kbps' },
  { value: 'lossless', label: '无损', desc: 'FLAC' },
];

export interface ThemeOption {
  value: ThemeMode;
  label: string;
}

export const themeOptions: ThemeOption[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

const settingStorageKey = 'cloud-setting';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export const useSettingStore = defineStore(
  'setting',
  () => {
    const theme = ref<ThemeMode>('light');
    const audioLevel = ref<AudioLevel>('exhigh');
    /** 设置面板 / 快捷键面板是否打开，由 header 与全局快捷键共同控制 */
    const panelOpen = ref(false);
    const panelTab = ref<'appearance' | 'shortcut'>('appearance');
    /** 解析后的实际主题，供需要判断明暗的组件使用（如深色版黑胶） */
    const isDark = ref(false);

    const audioLevelLabel = computed(
      () => audioLevelOptions.find((item) => item.value === audioLevel.value)?.label ?? '极高',
    );

    /** 把主题写到 <html data-theme>，CSS 变量在 theme.css 中按此切换 */
    const applyTheme = () => {
      const dark = theme.value === 'dark' || (theme.value === 'system' && darkQuery.matches);
      isDark.value = dark;
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };

    const setTheme = (value: ThemeMode) => {
      theme.value = value;
    };

    const setAudioLevel = (value: AudioLevel) => {
      audioLevel.value = value;
    };

    const openPanel = (tab: 'appearance' | 'shortcut' = 'appearance') => {
      panelTab.value = tab;
      panelOpen.value = true;
    };

    const closePanel = () => {
      panelOpen.value = false;
    };

    // 主题变化立即落到 DOM；跟随系统时还要响应系统切换
    watch(theme, applyTheme, { immediate: true });
    const onSystemThemeChange = () => {
      if (theme.value === 'system') {
        applyTheme();
      }
    };
    darkQuery.addEventListener('change', onSystemThemeChange);

    return {
      theme,
      audioLevel,
      audioLevelLabel,
      panelOpen,
      panelTab,
      isDark,
      setTheme,
      setAudioLevel,
      openPanel,
      closePanel,
      applyTheme,
    };
  },
  {
    persist: {
      key: settingStorageKey,
      storage: localStorage,
      pick: ['theme', 'audioLevel'],
    },
  },
);
