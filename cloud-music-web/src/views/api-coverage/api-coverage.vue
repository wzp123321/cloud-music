<template>
  <div class="api-coverage">
    <cm-navbar :title="'服务端接口总览'" :has-load-more="false"></cm-navbar>

    <header class="api-coverage--header">
      <div class="api-coverage--stats">
        <div class="api-coverage--stat">
          <b>{{ ROUTE_STATS.total }}</b><span>服务端接口</span>
        </div>
        <div class="api-coverage--stat">
          <b>{{ ROUTE_STATS.existing }}</b><span>已有页面接入</span>
        </div>
        <div class="api-coverage--stat is-highlight">
          <b>{{ ROUTE_STATS.added }}</b><span>本次对齐新增</span>
        </div>
        <div class="api-coverage--stat">
          <b>{{ ROUTE_STATS.domains }}</b><span>功能域</span>
        </div>
      </div>
      <p class="api-coverage--intro">
        清单由 <code>npm run sync:routes</code> 从服务端 <code>module/</code> 目录生成，与服务端自动注册的路由一一对应。
        点击任一接口可填写参数并真实发起请求；写操作需二次确认，页面不会自动发请求。
      </p>
    </header>

    <div class="api-coverage--toolbar">
      <input
        v-model="keyword"
        class="api-coverage--search"
        type="text"
        placeholder="搜索接口路径或 module 名，如 song/url、comment、vip"
      />
      <span class="api-coverage--count">匹配 {{ filtered.length }} 条</span>
    </div>

    <div class="api-coverage--body">
      <aside class="api-coverage--aside">
        <button
          class="api-coverage--domain"
          :class="{ active: activeDomain === 'all' }"
          @click="activeDomain = 'all'"
        >
          <span>全部接口</span><em>{{ ROUTE_STATS.total }}</em>
        </button>
        <button
          v-for="domain in ROUTE_DOMAINS"
          :key="domain.name"
          class="api-coverage--domain"
          :class="{ active: activeDomain === domain.name }"
          @click="activeDomain = domain.name"
        >
          <span>{{ domain.name }}</span><em>{{ domain.total }}</em>
        </button>
      </aside>

      <section class="api-coverage--list">
        <article
          v-for="route in visibleRoutes"
          :key="route.path"
          class="api-coverage--item"
          :class="{ expanded: expanded === route.path }"
        >
          <div class="api-coverage--row" @click="toggle(route.path)">
            <span class="api-coverage--path">{{ route.path }}</span>
            <span class="api-coverage--tag" :class="route.kind === 'write' ? 'is-write' : 'is-read'">
              {{ route.kind === 'write' ? '写操作' : '读取' }}
            </span>
            <span class="api-coverage--tag" :class="route.existing ? 'is-existing' : 'is-new'">
              {{ route.existing ? '已接入' : '新增' }}
            </span>
            <span class="api-coverage--module">{{ route.module }}</span>
            <span class="api-coverage--arrow">{{ expanded === route.path ? '收起' : '调用' }}</span>
          </div>

          <div v-if="expanded === route.path" class="api-coverage--panel">
            <div class="api-coverage--form">
              <label class="api-coverage--field">
                <span>请求方式</span>
                <select v-model="methods[route.path]" class="api-coverage--select">
                  <option value="post">POST</option>
                  <option value="get">GET</option>
                </select>
              </label>
              <label class="api-coverage--field is-wide">
                <span>参数（JSON 对象，登录凭证由请求层自动注入）</span>
                <textarea
                  v-model="paramTexts[route.path]"
                  class="api-coverage--textarea"
                  rows="3"
                  spellcheck="false"
                ></textarea>
              </label>
              <label v-if="route.file" class="api-coverage--field is-wide">
                <span>上传文件（FormData 提交）</span>
                <input class="api-coverage--file" type="file" @change="onFile(route.path, $event)" />
              </label>
            </div>

            <div class="api-coverage--actions">
              <button class="api-coverage--run" :disabled="results[route.path]?.loading" @click="run(route)">
                {{ results[route.path]?.loading ? '请求中…' : '发起请求' }}
              </button>
              <span v-if="route.kind === 'write'" class="api-coverage--hint">写操作会二次确认后才会提交</span>
              <span v-if="route.file" class="api-coverage--hint">该接口需要选择本地文件</span>
            </div>

            <pre
              v-if="results[route.path]"
              class="api-coverage--result"
              :class="{ 'is-error': results[route.path].error }"
            >{{ results[route.path].text }}</pre>
          </div>
        </article>

        <p v-if="!visibleRoutes.length" class="api-coverage--empty">没有匹配的接口，换个关键词试试</p>
        <button v-if="hasMore" class="api-coverage--more" @click="limit += 60">
          显示更多（还有 {{ filtered.length - limit }} 条）
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import {
  ROUTE_DOMAINS,
  ROUTE_STATS,
  SERVER_ROUTES,
  type ServerRoute,
} from '@/apis/server-coverage/routes';
import {
  callServerRoute,
  type RouteMethod,
} from '@/apis/server-coverage/server-coverage.service';

interface CallResult {
  loading: boolean;
  text: string;
  error: boolean;
}

const keyword = ref('');
const activeDomain = ref('all');
const limit = ref(60);
const expanded = ref('');
const methods = reactive<Record<string, RouteMethod>>({});
const paramTexts = reactive<Record<string, string>>({});
const files = reactive<Record<string, File | null>>({});
const results = reactive<Record<string, CallResult>>({});

const filtered = computed<ServerRoute[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  return SERVER_ROUTES.filter((route) => {
    if (activeDomain.value !== 'all' && route.domain !== activeDomain.value) return false;
    if (!kw) return true;
    return (
      route.path.toLowerCase().includes(kw) ||
      route.module.toLowerCase().includes(kw) ||
      route.domain.toLowerCase().includes(kw)
    );
  });
});

const visibleRoutes = computed(() => filtered.value.slice(0, limit.value));
const hasMore = computed(() => filtered.value.length > limit.value);

watch([keyword, activeDomain], () => {
  limit.value = 60;
});

const toggle = (routePath: string) => {
  expanded.value = expanded.value === routePath ? '' : routePath;
  if (!paramTexts[routePath]) paramTexts[routePath] = '{}';
  if (!methods[routePath]) methods[routePath] = 'post';
};

const onFile = (routePath: string, event: Event) => {
  files[routePath] = (event.target as HTMLInputElement).files?.[0] ?? null;
};

const run = async (route: ServerRoute) => {
  if (
    route.kind === 'write' &&
    !window.confirm(`确认调用写操作【${route.path}】吗？该请求会向服务端提交数据。`)
  ) {
    return;
  }

  let params: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(paramTexts[route.path]?.trim() || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('参数必须是 JSON 对象');
    }
    params = parsed as Record<string, unknown>;
  } catch (error) {
    results[route.path] = {
      loading: false,
      text: `参数解析失败：${(error as Error).message}`,
      error: true,
    };
    return;
  }

  results[route.path] = { loading: true, text: '请求中…', error: false };
  try {
    const res = await callServerRoute(route.path, {
      method: methods[route.path] || 'post',
      params,
      file: route.file ? files[route.path] : null,
    });
    results[route.path] = {
      loading: false,
      text: JSON.stringify(res, null, 2) ?? '无返回内容',
      error: false,
    };
  } catch (error) {
    results[route.path] = {
      loading: false,
      text: `请求失败：${(error as Error)?.message ?? '未知错误'}`,
      error: true,
    };
  }
};
</script>

<style scoped lang="less">
.api-coverage {
  max-width: 1400px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 24px 24px 56px;

  &--header {
    margin-top: 20px;
  }

  &--stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  &--stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 20px;
    background: var(--color-default, #fff);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 10px;

    b {
      font-size: 26px;
      line-height: 32px;
      font-weight: 600;
      color: #2b2b2b;
    }

    span {
      font-size: 12px;
      color: #999;
    }

    &.is-highlight b {
      color: var(--color-primary, #c20c0c);
    }
  }

  &--intro {
    margin-top: 14px;
    font-size: 13px;
    line-height: 22px;
    color: #888;

    code {
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.05);
      font-family: Consolas, Monaco, monospace;
      color: #555;
    }
  }

  &--toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
  }

  &--search {
    flex: 1;
    height: 40px;
    padding: 0 14px;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    outline: none;
    font-size: 14px;
    background: var(--color-default, #fff);
    color: #333;

    &::placeholder {
      color: #bbb;
    }
  }

  &--count {
    font-size: 13px;
    color: #999;
    white-space: nowrap;
  }

  &--body {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 16px;
    margin-top: 16px;
    align-items: start;
  }

  &--aside {
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    padding: 8px;
    box-sizing: border-box;
    background: var(--color-default, #fff);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 10px;
  }

  &--domain {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: #666;
    text-align: left;

    em {
      font-style: normal;
      font-size: 11px;
      color: #bbb;
    }

    &:hover {
      background: rgba(194, 12, 12, 0.04);
      color: #333;
    }

    &.active {
      background: var(--color-primary, #c20c0c);
      color: #fff;

      em {
        color: rgba(255, 255, 255, 0.75);
      }
    }
  }

  &--list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &--item {
    background: var(--color-default, #fff);
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s;

    &:hover {
      border-color: rgba(194, 12, 12, 0.35);
    }

    &.expanded {
      border-color: var(--color-primary, #c20c0c);
    }
  }

  &--row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    cursor: pointer;
  }

  &--path {
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    font-weight: 600;
    color: #2b2b2b;
    word-break: break-all;
  }

  &--tag {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    line-height: 16px;

    &.is-read {
      background: rgba(0, 0, 0, 0.05);
      color: #888;
    }

    &.is-write {
      background: rgba(194, 12, 12, 0.08);
      color: var(--color-primary, #c20c0c);
    }

    &.is-existing {
      background: rgba(0, 0, 0, 0.05);
      color: #999;
    }

    &.is-new {
      background: rgba(194, 12, 12, 0.08);
      color: var(--color-primary, #c20c0c);
    }
  }

  &--module {
    margin-left: auto;
    font-size: 11px;
    color: #bbb;
    white-space: nowrap;
  }

  &--arrow {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--color-primary, #c20c0c);
  }

  &--panel {
    padding: 0 16px 16px;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);
  }

  &--form {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 12px;
    margin-top: 14px;
  }

  &--field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: #888;

    &.is-wide {
      grid-column: 2;
    }
  }

  &--select,
  &--textarea {
    box-sizing: border-box;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    outline: none;
    font-size: 13px;
    color: #333;
    background: #fff;
  }

  &--textarea {
    resize: vertical;
    font-family: Consolas, Monaco, monospace;
    line-height: 18px;
  }

  &--file {
    font-size: 12px;
  }

  &--actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }

  &--run {
    padding: 8px 20px;
    border: 0;
    border-radius: 6px;
    background: var(--color-primary, #c20c0c);
    color: #fff;
    font-size: 13px;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }

  &--hint {
    font-size: 12px;
    color: #aaa;
  }

  &--result {
    max-height: 320px;
    overflow: auto;
    margin: 12px 0 0;
    padding: 12px 14px;
    border-radius: 6px;
    background: #f7f7f8;
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 18px;
    color: #333;
    white-space: pre-wrap;
    word-break: break-all;

    &.is-error {
      background: rgba(194, 12, 12, 0.05);
      color: var(--color-primary, #c20c0c);
    }
  }

  &--empty {
    padding: 40px 0;
    text-align: center;
    font-size: 13px;
    color: #aaa;
  }

  &--more {
    align-self: center;
    margin-top: 8px;
    padding: 10px 24px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    background: var(--color-default, #fff);
    color: #666;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-primary, #c20c0c);
      color: var(--color-primary, #c20c0c);
    }
  }
}

@media (max-width: 900px) {
  .api-coverage {
    &--stats {
      grid-template-columns: repeat(2, 1fr);
    }

    &--body {
      grid-template-columns: 1fr;
    }

    &--aside {
      max-height: 180px;
    }

    &--module {
      display: none;
    }
  }
}
</style>
