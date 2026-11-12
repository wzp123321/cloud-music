<template>
  <div class="dj-radio">
    <cm-navbar :title="'电台 · 分类 · 节目 · 榜单'" :has-load-more="false"></cm-navbar>

    <div v-if="!hasLogin" class="dj-radio--loginbar">
      当前未登录：<code>dj_sub</code> 订阅写操作与 <code>dj_sublist</code> 订阅列表已降级（不发请求）；其余匿名只读接口可正常加载
    </div>
    <div v-if="toast" class="dj-radio--toast" @click="clearToast">{{ toast }}（点击关闭）</div>

    <div class="dj-radio--tabs">
      <button
        v-for="tab in tabs"
        :key="tab.code"
        :class="['dj-radio--tab', activeTab === tab.code ? 'active' : '']"
        @click="switchTab(tab.code)"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 共享参数链路面板：上游列表点选自动填入，跨 tab 保留，也可手填 -->
    <div class="dj-radio--params">
      <span class="dj-radio--params-label">参数链路（点选上游列表自动填入，跨 tab 保留，也可手填）</span>
      <label class="dj-radio--params-item">
        rid（电台 id → dj_detail / dj_program / dj_sub / dj_subscriber）
        <input v-model="params.rid" placeholder="← dj_hot / dj_recommend / dj_toplist* 点选" />
      </label>
      <label class="dj-radio--params-item">
        cateId（分类 id → dj_radio_hot / dj_category_recommend）
        <input v-model="params.cateId" placeholder="← dj_catelist 点选" />
      </label>
      <label class="dj-radio--params-item">
        programId（节目 id → dj_program_detail）
        <input v-model="params.programId" placeholder="← dj_program 的 programs 点选" />
      </label>
    </div>

    <div class="dj-radio--panel">
      <p class="dj-radio--panel-tip">{{ panelTip }}</p>
      <div class="dj-radio--grid grid-cols-2">
        <!-- 每个接口一个可交互区块，标题标注 module 名 -->
        <section
          v-for="b in visibleBlocks"
          :key="b.module"
          class="dj-radio--block"
          :class="{ 'dj-radio--block--wide': b.wide }"
        >
          <h3 class="dj-radio--block-title">
            <code class="dj-radio--module">{{ b.module }}</code> {{ b.name }}
            <span v-if="b.kind === 'invalid'" class="dj-radio--badge dj-radio--badge--invalid">已登记失效</span>
            <span v-else-if="b.kind === 'pending'" class="dj-radio--badge dj-radio--badge--pending">待核·不进主路径</span>
            <span v-else-if="b.kind === 'write' || b.kind === 'upload'" class="dj-radio--badge dj-radio--badge--write">写操作</span>
            <span v-else-if="b.kind === 'loginRead'" class="dj-radio--badge dj-radio--badge--login">需登录只读</span>
          </h3>
          <p v-if="b.note" class="dj-radio--note">{{ b.note }}</p>
          <p v-if="(b.kind === 'loginRead' || b.kind === 'write' || b.kind === 'upload') && !hasLogin" class="dj-radio--degrade">
            登录后可用（已降级，不发请求）
          </p>
          <div class="dj-radio--block-actions">
            <label v-if="b.inputKey" class="dj-radio--inline-label">
              {{ b.inputLabel || b.inputKey }}
              <input
                :value="params[b.inputKey || '']"
                :placeholder="b.inputHint || '点选上游列表自动填入，或手填'"
                @input="onParamInput(b.inputKey, $event)"
              />
            </label>
            <label v-if="b.kind === 'upload'" class="dj-radio--inline-label">
              选择文件<input type="file" @change="onFileChange" />
            </label>
            <button
              class="dj-radio--btn"
              :class="{ 'dj-radio--btn--write': b.kind === 'write' || b.kind === 'upload' }"
              @click="runBlock(b)"
            >
              {{ b.buttonText || '加载' }}
            </button>
            <span class="dj-radio--count">{{ results[b.module]?.length || 0 }} 条</span>
            <span v-if="b.emit" class="dj-radio--emit">点选列表项 → 填入 {{ b.emit }}</span>
          </div>
          <div v-if="results[b.module] && results[b.module].length" class="dj-radio--list">
            <div
              v-for="(item, idx) in results[b.module]"
              :key="b.module + '_' + idx"
              class="dj-radio--item"
              :class="{ 'dj-radio--item--clickable': !!b.emit }"
              @click="onItemClick(b, item)"
            >
              <span class="dj-radio--item-title">{{ item.title }}</span>
              <span class="dj-radio--item-sub">{{ item.subtitle }}</span>
              <span v-if="item.id" class="dj-radio--item-id">#{{ item.id }}</span>
            </div>
          </div>
          <p v-else class="dj-radio--empty">暂无数据或接口返回为空</p>
        </section>
      </div>
      <div v-if="writeResult" class="dj-radio--result">{{ writeResult }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDjRadio } from './hooks/useDjRadio';

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
} = useDjRadio();
</script>

<style scoped lang="less">
.dj-radio {
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
