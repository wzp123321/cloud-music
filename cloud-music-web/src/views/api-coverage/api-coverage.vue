<template>
  <div class="api-coverage">
    <cm-navbar :title="'服务端接口总览'" :has-load-more="false"></cm-navbar>

    <header class="api-coverage--header">
      <div class="api-coverage--stats">
        <div class="api-coverage--stat">
          <b>{{ ROUTE_STATS.total }}</b
          ><span>服务端接口</span>
        </div>
        <div class="api-coverage--stat">
          <b>{{ ROUTE_STATS.existing }}</b
          ><span>已有页面接入</span>
        </div>
        <div class="api-coverage--stat is-highlight">
          <b>{{ ROUTE_STATS.added }}</b
          ><span>本次对齐新增</span>
        </div>
        <div class="api-coverage--stat">
          <b>{{ ROUTE_STATS.domains }}</b
          ><span>功能域</span>
        </div>
      </div>
      <p class="api-coverage--intro">
        清单由 <code>npm run sync:routes</code> 从服务端 <code>module/</code> 目录生成，与服务端自动注册的路由一一对应。
        参数表单由 <code>interface.d.ts</code> 解析而来（{{ ROUTE_STATS.withParams }} 条接口 /
        {{ ROUTE_STATS.paramCount }} 个参数 / {{ ROUTE_STATS.enums }} 组枚举）， 缺失部分由 module
        源码补齐。写操作需二次确认，页面不会自动发请求。
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
        <button class="api-coverage--domain" :class="{ active: activeDomain === 'all' }" @click="activeDomain = 'all'">
          <span>全部接口</span><em>{{ ROUTE_STATS.total }}</em>
        </button>
        <button
          v-for="domain in ROUTE_DOMAINS"
          :key="domain.name"
          class="api-coverage--domain"
          :class="{ active: activeDomain === domain.name }"
          @click="activeDomain = domain.name"
        >
          <span>{{ domain.name }}</span
          ><em>{{ domain.total }}</em>
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
                <el-select v-model="methods[route.path]" class="api-coverage--select">
                  <el-option value="post" label="POST" />
                  <el-option value="get" label="GET" />
                </el-select>
              </label>
              <div v-if="paramsFor(route.path).length" class="api-coverage--schema">
                <div class="api-coverage--schema-head">
                  <span>参数表单</span>
                  <em>{{ paramsFor(route.path).length }} 项 · 必填项留空会提示</em>
                </div>
                <div class="api-coverage--schema-grid">
                  <label v-for="param in paramsFor(route.path)" :key="param.name" class="api-coverage--field">
                    <span class="api-coverage--param-label">
                      <b>{{ param.name }}</b>
                      <i v-if="param.required">必填</i>
                      <small>{{ param.raw }}</small>
                    </span>
                    <select
                      v-if="param.type === 'enum' || param.type === 'boolean'"
                      v-model="paramValues[route.path][param.name]"
                      class="api-coverage--select"
                    >
                      <option value="">不传</option>
                      <option v-for="opt in enumOptions(param)" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <input
                      v-else
                      v-model="paramValues[route.path][param.name]"
                      class="api-coverage--input"
                      :type="param.type === 'number' ? 'number' : 'text'"
                      :placeholder="param.hint ? '默认 ' + param.hint : '可选'"
                    />
                  </label>
                </div>
              </div>
              <div v-else class="api-coverage--schema-empty">该接口无需业务参数</div>
              <label class="api-coverage--field is-wide">
                <span>附加参数（JSON 对象，覆盖同名表单项；登录凭证由请求层自动注入）</span>
                <textarea v-model="paramTexts[route.path]" class="api-coverage--textarea" rows="3" spellcheck="false" />
              </label>
              <label v-if="route.file" class="api-coverage--field is-wide">
                <span>上传文件（FormData 提交）</span>
                <cm-input class="api-coverage--file" type="file" @change="onFile(route.path, $event)" />
              </label>
            </div>

            <div class="api-coverage--actions">
              <cm-button class="api-coverage--run" :disabled="results[route.path]?.loading" @click="run(route)">
                {{ results[route.path]?.loading ? '请求中…' : '发起请求' }}
              </cm-button>
              <span v-if="route.kind === 'write'" class="api-coverage--hint">写操作会二次确认后才会提交</span>
              <span v-if="route.file" class="api-coverage--hint">该接口需要选择本地文件</span>
            </div>

            <pre
              v-if="results[route.path]"
              class="api-coverage--result"
              :class="{ 'is-error': results[route.path].error }"
              >{{ results[route.path].text }}</pre
            >
          </div>
        </article>

        <p v-if="!visibleRoutes.length" class="api-coverage--empty">没有匹配的接口，换个关键词试试</p>
        <cm-button v-if="hasMore" class="api-coverage--more" @click="limit += 60">
          显示更多（还有 {{ filtered.length - limit }} 条）
        </cm-button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import {
  ROUTE_DOMAINS,
  ROUTE_PARAMS,
  ROUTE_STATS,
  SERVER_ROUTES,
  type ServerRoute,
  type ServerRouteParam,
} from '@/apis/server-coverage/routes';
import { callServerRoute, type RouteMethod } from '@/apis/server-coverage/server-coverage.service';

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
const paramValues = reactive<Record<string, Record<string, string>>>({});
const files = reactive<Record<string, File | null>>({});
const results = reactive<Record<string, CallResult>>({});

/** 文件类参数由统一上传控件处理，不重复放进表单 */
const paramsFor = (routePath: string): ServerRouteParam[] =>
  (ROUTE_PARAMS[routePath] || []).filter((param) => param.type !== 'file');

const enumOptions = (param: ServerRouteParam): string[] =>
  param.options || (param.type === 'boolean' ? ['true', 'false'] : []);

const coerceValue = (param: ServerRouteParam, raw: string): unknown => {
  if (param.type === 'number') {
    const value = Number(raw);
    return Number.isNaN(value) ? raw : value;
  }
  if (param.type === 'boolean') return raw === 'true' || raw === '1';
  if (param.type === 'object') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

/** 表单值覆盖附加 JSON 的同名字段，并校验必填项 */
const collectParams = (route: ServerRoute): { params?: Record<string, unknown>; error?: string } => {
  let params: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(paramTexts[route.path]?.trim() || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('参数必须是 JSON 对象');
    }
    params = parsed as Record<string, unknown>;
  } catch (error) {
    return { error: `参数解析失败：${(error as Error).message}` };
  }

  const values = paramValues[route.path] || {};
  for (const param of paramsFor(route.path)) {
    const raw = (values[param.name] || '').trim();
    if (!raw) continue;
    params[param.name] = coerceValue(param, raw);
  }

  const missing = paramsFor(route.path)
    .filter((param) => param.required && (params[param.name] === undefined || params[param.name] === ''))
    .map((param) => param.name);
  if (missing.length) return { error: `缺少必填参数：${missing.join('、')}` };
  return { params };
};

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
  if (!paramValues[routePath]) paramValues[routePath] = {};
};

const onFile = (routePath: string, event: Event) => {
  files[routePath] = (event.target as HTMLInputElement).files?.[0] ?? null;
};

const run = async (route: ServerRoute) => {
  if (route.kind === 'write' && !window.confirm(`确认调用写操作【${route.path}】吗？该请求会向服务端提交数据。`)) {
    return;
  }

  const { params, error: paramError } = collectParams(route);
  if (paramError) {
    results[route.path] = { loading: false, text: paramError, error: true };
    return;
  }

  results[route.path] = { loading: true, text: '请求中…', error: false };
  try {
    const res = await callServerRoute(route.path, {
      method: methods[route.path] || 'post',
      params: params || {},
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
      grid-column: 1 / -1;
    }
  }

  &--schema {
    grid-column: 1 / -1;
    padding: 12px;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.015);
  }

  &--schema-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 600;
    color: #666;

    em {
      font-style: normal;
      font-weight: 400;
      color: #aaa;
    }
  }

  &--schema-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
  }

  &--schema-empty {
    grid-column: 1 / -1;
    font-size: 12px;
    color: #aaa;
  }

  &--param-label {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;

    b {
      font-family: Consolas, Monaco, monospace;
      font-size: 12px;
      font-weight: 600;
      color: #444;
    }

    i {
      flex-shrink: 0;
      font-style: normal;
      font-size: 10px;
      color: var(--color-primary, #c20c0c);
    }

    small {
      overflow: hidden;
      font-size: 10px;
      color: #bbb;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &--select,
  &--input,
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

    &--schema-grid {
      grid-template-columns: 1fr;
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
