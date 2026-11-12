<template>
  <div class="yunbei-vip-musician">
    <cm-navbar :title="'云贝 · 会员成长 · 音乐人中心'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="yunbei-vip-musician--loginbar">
      当前未登录：本页 <code>yunbei*</code> / <code>vip_*</code> / <code>musician_*</code> 需登录只读接口与 4 个写操作均已降级（不发请求）；
      <code>yunbei_info</code> 已登记失效（上游 404）
    </div>
    <div v-if="toast" class="yunbei-vip-musician--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="yunbei-vip-musician--tabs">
      <cm-button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['yunbei-vip-musician--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </cm-button>
    </div>

    <!-- 共享参数链路面板：上游任务列表点选自动填入，也可手填 -->
    <div class="yunbei-vip-musician--params">
      <span class="yunbei-vip-musician--params-label">参数链路（点选任务列表自动填入，也可手填）</span>
      <label class="yunbei-vip-musician--params-item">
        taskId（任务 id → yunbei_task_finish）
        <cm-input v-model="params.taskId" placeholder="← yunbei_tasks / yunbei_tasks_todo 点选" />
      </label>
      <label class="yunbei-vip-musician--params-item">
        songId（歌曲 id → yunbei_rcmd_song）
        <cm-input v-model="params.songId" placeholder="手填歌曲 id" />
      </label>
    </div>

    <div class="yunbei-vip-musician--panel">
      <p class="yunbei-vip-musician--panel-tip">{{ panelTip }}</p>
      <div class="yunbei-vip-musician--grid grid-cols-2">
        <!-- 每个接口一个可交互区块，标题标注 module 名 -->
        <section
          v-for="b in visibleBlocks"
          :key="b.module"
          class="yunbei-vip-musician--block"
          :class="{ 'yunbei-vip-musician--block--wide': b.wide }"
        >
          <h3 class="yunbei-vip-musician--block-title">
            <code class="yunbei-vip-musician--module">{{ b.module }}</code> {{ b.name }}
            <span v-if="b.kind === 'invalid'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--invalid">已登记失效</span>
            <span v-else-if="b.kind === 'pending'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--pending">待核·不进主路径</span>
            <span v-else-if="b.kind === 'write' || b.kind === 'upload'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--write">写操作</span>
            <span v-else-if="b.kind === 'loginRead'" class="yunbei-vip-musician--badge yunbei-vip-musician--badge--login">需登录只读</span>
          </h3>
          <p v-if="b.note" class="yunbei-vip-musician--note">{{ b.note }}</p>
          <p v-if="(b.kind === 'loginRead' || b.kind === 'write' || b.kind === 'upload') && !hasLogin" class="yunbei-vip-musician--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div class="yunbei-vip-musician--block-actions">
            <label v-if="b.inputKey" class="yunbei-vip-musician--inline-label">
              {{ b.inputLabel || b.inputKey }}
              <cm-input
                :value="params[b.inputKey || '']"
                :placeholder="b.inputHint || '点选上游列表自动填入，或手填'"
                @input="onParamInput(b.inputKey, $event)"
              />
            </label>
            <label v-if="b.kind === 'upload'" class="yunbei-vip-musician--inline-label">
              选择文件<cm-input type="file" @change="onFileChange" />
            </label>
            <cm-button
              class="yunbei-vip-musician--btn"
              :class="{ 'yunbei-vip-musician--btn--write': b.kind === 'write' || b.kind === 'upload' }"
              @click="runBlock(b)"
            >
              {{ b.buttonText || '加载' }}
            </cm-button>
            <span class="yunbei-vip-musician--count">{{ results[b.module]?.length || 0 }} 条</span>
            <span v-if="b.emit" class="yunbei-vip-musician--emit">点选列表项 → 填入 {{ b.emit }}</span>
          </div>
          <div v-if="results[b.module] && results[b.module].length" class="yunbei-vip-musician--list">
            <div
              v-for="(item, idx) in results[b.module]"
              :key="b.module + '_' + idx"
              class="yunbei-vip-musician--item"
              :class="{ 'yunbei-vip-musician--item--clickable': !!b.emit }"
              @click="onItemClick(b, item)"
            >
              <span class="yunbei-vip-musician--item-title">{{ item.title }}</span>
              <span class="yunbei-vip-musician--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="yunbei-vip-musician--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="yunbei-vip-musician--empty">暂无数据或接口返回为空</p>
        </section>
      </div>
      <div v-if="writeResult" class="yunbei-vip-musician--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useYunbeiVipMusician } from './hooks/useYunbeiVipMusician';

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
} = useYunbeiVipMusician();
</script>

<style scoped lang="less">
.yunbei-vip-musician {
  max-width: 1200px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 48px;

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
