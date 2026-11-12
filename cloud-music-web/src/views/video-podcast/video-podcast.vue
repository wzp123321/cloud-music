<template>
  <div class="video-podcast">
    <cm-navbar :title="'视频 · 播客 · 信息流 · 上传'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="video-podcast--loginbar">
      当前未登录：<code>video_timeline_*</code>、<code>voicelist_*</code>、<code>voice_detail</code> 等需登录只读接口已降级（不发请求）；
      <code>video_sub</code> / <code>voice_upload</code> 写操作不可用
    </div>
    <div v-if="toast" class="video-podcast--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="video-podcast--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['video-podcast--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 共享参数链路面板：上游列表点选自动填入，跨 tab 保留，也可手填 -->
    <div class="video-podcast--params">
      <span class="video-podcast--params-label">参数链路（点选上游列表自动填入，跨 tab 保留，也可手填）</span>
      <label class="video-podcast--params-item">
        videoId（视频 id/vid → video_detail / video_detail_info / video_url / video_sub）
        <input v-model="params.videoId" placeholder="← video_group_list / video_timeline_all 点选" />
      </label>
      <label class="video-podcast--params-item">
        voiceId（播客 id → voicelist_search / voice_detail）
        <input v-model="params.voiceId" placeholder="← voicelist_list 点选" />
      </label>
      <label class="video-podcast--params-item">
        voiceKeyword（关键词 → voicelist_list_search / voicelist_search）
        <input v-model="params.voiceKeyword" placeholder="输入播客关键词" />
      </label>
    </div>

    <div class="video-podcast--panel">
      <p class="video-podcast--panel-tip">{{ panelTip }}</p>
      <div class="video-podcast--grid grid-cols-2">
        <!-- 每个接口一个可交互区块，标题标注 module 名 -->
        <section
          v-for="b in visibleBlocks"
          :key="b.module"
          class="video-podcast--block"
          :class="{ 'video-podcast--block--wide': b.wide }"
        >
          <h3 class="video-podcast--block-title">
            <code class="video-podcast--module">{{ b.module }}</code> {{ b.name }}
            <span v-if="b.kind === 'invalid'" class="video-podcast--badge video-podcast--badge--invalid">已登记失效</span>
            <span v-else-if="b.kind === 'pending'" class="video-podcast--badge video-podcast--badge--pending">待核·不进主路径</span>
            <span v-else-if="b.kind === 'write' || b.kind === 'upload'" class="video-podcast--badge video-podcast--badge--write">写操作</span>
            <span v-else-if="b.kind === 'loginRead'" class="video-podcast--badge video-podcast--badge--login">需登录只读</span>
          </h3>
          <p v-if="b.note" class="video-podcast--note">{{ b.note }}</p>
          <p v-if="(b.kind === 'loginRead' || b.kind === 'write' || b.kind === 'upload') && !hasLogin" class="video-podcast--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div class="video-podcast--block-actions">
            <label v-if="b.inputKey" class="video-podcast--inline-label">
              {{ b.inputLabel || b.inputKey }}
              <input
                :value="params[b.inputKey || '']"
                :placeholder="b.inputHint || '点选上游列表自动填入，或手填'"
                @input="onParamInput(b.inputKey, $event)"
              />
            </label>
            <label v-if="b.kind === 'upload'" class="video-podcast--inline-label">
              选择文件<input type="file" accept="audio/*" @change="onFileChange" />
            </label>
            <button
              class="video-podcast--btn"
              :class="{ 'video-podcast--btn--write': b.kind === 'write' || b.kind === 'upload' }"
              @click="runBlock(b)"
            >
              {{ b.buttonText || '加载' }}
            </button>
            <span class="video-podcast--count">{{ results[b.module]?.length || 0 }} 条</span>
            <span v-if="b.emit" class="video-podcast--emit">点选列表项 → 填入 {{ b.emit }}</span>
          </div>
          <div v-if="results[b.module] && results[b.module].length" class="video-podcast--list">
            <div
              v-for="(item, idx) in results[b.module]"
              :key="b.module + '_' + idx"
              class="video-podcast--item"
              :class="{ 'video-podcast--item--clickable': !!b.emit }"
              @click="onItemClick(b, item)"
            >
              <span class="video-podcast--item-title">{{ item.title }}</span>
              <span class="video-podcast--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="video-podcast--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="video-podcast--empty">暂无数据或接口返回为空</p>
        </section>
      </div>
      <div v-if="writeResult" class="video-podcast--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVideoPodcast } from './hooks/useVideoPodcast';

const {
  tabs,
  hasLogin,
  activeTab,
  toast,
  writeResult,
  params,
  results,
  visibleBlocks,
  panelTip,
  onFileChange,
  onParamInput,
  onItemClick,
  runBlock,
  switchTab,
  clearToast,
} = useVideoPodcast();
</script>

<style scoped lang="less">
.video-podcast {
  width: 1200px;
  margin: 0 auto;
  padding: 24px 0 48px;

  code {
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(194, 12, 12, 0.08);
    color: var(--color-primary, #c20c0c);
    font-size: 12px;
  }

  &--loginbar {
    margin-top: 18px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #fff7e6;
    color: #ad6800;
    font-size: 13px;
    line-height: 1.7;
  }

  &--toast {
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: 6px;
    background: #f0f7ff;
    color: #31708f;
    font-size: 13px;
    cursor: pointer;
  }

  &--tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  &--tab {
    padding: 8px 18px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 18px;
    background: var(--color-default, #fff);
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &.active {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
      background: rgba(194, 12, 12, 0.06);
    }
  }

  &--params {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-top: 18px;
    padding: 14px 18px;
    background: var(--color-default, #fff);
    border-radius: 8px;
  }

  &--params-label {
    color: #999;
    font-size: 13px;
  }

  &--params-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 13px;

    input {
      width: 210px;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary, #c20c0c);
      }
    }
  }

  &--panel {
    margin-top: 22px;
  }

  &--panel-tip {
    margin-bottom: 16px;
    color: #999;
    font-size: 13px;
    line-height: 1.7;
  }

  &--grid {
    display: grid;
    gap: 20px;
  }

  &--block {
    padding: 16px 20px;
    border-radius: 8px;
    background: var(--color-default, #fff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  &--block--wide {
    grid-column: 1 / -1;
  }

  &--block-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  &--module {
    margin-right: 6px;
  }

  &--badge {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 400;
    vertical-align: middle;
  }

  &--badge--invalid,
  &--badge--write {
    background: #fff1f0;
    color: #cf1322;
  }

  &--badge--pending {
    background: #fff7e6;
    color: #d48806;
  }

  &--badge--login {
    background: #f0f5ff;
    color: #2f54eb;
  }

  &--note {
    margin-top: 8px;
    color: #999;
    font-size: 12px;
    line-height: 1.6;
  }

  &--degrade {
    margin-top: 8px;
    color: #d48806;
    font-size: 12px;
  }

  &--block-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 12px 0;
  }

  &--inline-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 13px;

    input {
      width: 190px;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: var(--color-primary, #c20c0c);
      }
    }

    input[type='file'] {
      width: 200px;
      padding: 4px 0;
      border: none;
    }
  }

  &--btn {
    padding: 7px 16px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    background: var(--color-default, #fff);
    color: #444;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
    }
  }

  &--btn--write {
    border-color: var(--color-primary, #c20c0c);
    color: var(--color-primary, #c20c0c);
  }

  &--count,
  &--emit {
    color: #999;
    font-size: 12px;
  }

  &--emit {
    color: #2f54eb;
  }

  &--list {
    margin-top: 10px;
    max-height: 240px;
    overflow-y: auto;
  }

  &--item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 6px;
    border-bottom: 1px solid #f5f5f5;
  }

  &--item--clickable {
    cursor: pointer;

    &:hover {
      background: #fafafa;
    }
  }

  &--item-title {
    flex: 1;
    color: #333;
    font-size: 13px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &--item-sub,
  &--item-id {
    color: #aaa;
    font-size: 12px;
    white-space: nowrap;
  }

  &--empty {
    margin-top: 10px;
    color: #bbb;
    font-size: 12px;
  }

  &--result {
    margin-top: 20px;
    padding: 12px 18px;
    border-radius: 8px;
    background: #f6ffed;
    color: #389e0d;
    font-size: 13px;
  }
}
</style>
