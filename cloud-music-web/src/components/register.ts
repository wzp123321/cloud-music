import { defineAsyncComponent, type App, type Component } from 'vue';

/**
 * 全局组件注册表：显式清单，注册名沿用文件名（kebab-case）。
 * 每个组件独立异步加载，避免全量 eager 注册把组件一次性堆进主包。
 */
const components: Record<string, Component> = {
  'cm-album-card': defineAsyncComponent(() => import('./cm-album-card/cm-album-card.vue')),
  'cm-api-block': defineAsyncComponent(() => import('./cm-api-block/cm-api-block.vue')),
  'cm-audio': defineAsyncComponent(() => import('./cm-audio/cm-audio.vue')),
  'cm-button': defineAsyncComponent(() => import('./cm-button/cm-button.vue')),
  'cm-comment': defineAsyncComponent(() => import('./cm-comment/cm-comment.vue')),
  'cm-comment-editor': defineAsyncComponent(() => import('./cm-comment/cm-comment-editor.vue')),
  'cm-comment-item': defineAsyncComponent(() => import('./cm-comment/cm-comment-item.vue')),
  'cm-error': defineAsyncComponent(() => import('./cm-error/cm-error.vue')),
  'cm-icon': defineAsyncComponent(() => import('./cm-icon/cm-icon.vue')),
  'cm-image': defineAsyncComponent(() => import('./cm-image/cm-image.vue')),
  'cm-input': defineAsyncComponent(() => import('./cm-input/cm-input.vue')),
  'cm-loading': defineAsyncComponent(() => import('./cm-loading/cm-loading.vue')),
  'cm-media-grid': defineAsyncComponent(() => import('./cm-media-grid/cm-media-grid.vue')),
  'cm-mv-card': defineAsyncComponent(() => import('./cm-mv-card/cm-mv-card.vue')),
  'cm-navbar': defineAsyncComponent(() => import('./cm-navbar/cm-navbar.vue')),
  'cm-playlist-card': defineAsyncComponent(() => import('./cm-playlist-card/cm-playlist-card.vue')),
  'cm-playlist-table': defineAsyncComponent(() => import('./cm-playlist-table/cm-playlist-table.vue')),
  'cm-simi': defineAsyncComponent(() => import('./cm-simi/cm-simi.vue')),
  'cm-skeleton': defineAsyncComponent(() => import('./cm-skeleton/cm-skeleton.vue')),
  'cm-table': defineAsyncComponent(() => import('./cm-table/cm-table.vue')),
  'cm-textarea': defineAsyncComponent(() => import('./cm-textarea/cm-textarea.vue')),
  'cm-video': defineAsyncComponent(() => import('./cm-video/cm-video.vue')),
};

export default function registerGlobalComponents(app: App): void {
  Object.entries(components).forEach(([name, component]) => {
    app.component(name, component);
  });
}
