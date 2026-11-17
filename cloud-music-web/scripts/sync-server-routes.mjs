/* eslint-disable no-console, no-undef */
/**
 * 从 cloud-music-server/module 生成前端全量接口清单。
 *
 * server 由 server.js 按「文件名去 .js、下划线转斜杠」自动注册路由，
 * 因此这里复用同一规则，保证前端清单与服务端实际接口一一对齐。
 * server 重新拉取代码后执行 `npm run sync:routes` 即可重新对齐。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const repoRoot = path.resolve(webRoot, '..');
const moduleDir = path.join(repoRoot, 'cloud-music-server', 'module');
const outDir = path.join(webRoot, 'src', 'apis', 'server-coverage');
const outFile = path.join(outDir, 'routes.ts');

if (!fs.existsSync(moduleDir)) {
  console.error('[sync-routes] 未找到服务端 module 目录:', moduleDir);
  process.exit(1);
}

/** 与 server.js 的 special 映射保持一致 */
const specialRoute = {
  'daily_signin.js': '/daily_signin',
  'fm_trash.js': '/fm_trash',
  'personal_fm.js': '/personal_fm',
};

const moduleFiles = fs.readdirSync(moduleDir).filter((file) => file.endsWith('.js')).sort();
const routes = moduleFiles.map((file) => {
  const routePath = specialRoute[file] || `/${file.replace(/\.js$/i, '').replace(/_/g, '/')}`;
  return {
    path: routePath,
    module: file.replace(/\.js$/i, ''),
    domain: routePath.split('/')[1] || 'other',
  };
});

/** 扫描前端源码里出现过的接口路径，用于标注「已有页面接入」与「新增对齐」 */
const referenced = new Set();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(ts|vue|js)$/.test(entry.name)) {
      // 只跳过生成的清单文件本身：否则上一版 routes.ts 的 439 条路径会被误算成「已接入」。
      // 同目录下的手写 service（如 high-value.service.ts）必须计入，它是真实接入点。
      if (full === outFile) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const match of text.matchAll(/['"`](\/[A-Za-z0-9_./-]+)['"`]/g)) {
        referenced.add(match[1].replace(/\/$/, ''));
      }
    }
  }
};
walk(path.join(webRoot, 'src'));

/** 会向服务端提交数据的接口：页面强制二次确认，不自动发请求 */
const writeTail = new Set([
  'like', 'unlike', 'sub', 'unsub', 'subscribe', 'unsubscribe', 'add', 'del', 'delete',
  'update', 'create', 'upload', 'sign', 'report', 'follow', 'unfollow', 'collect',
  'send', 'import', 'finish', 'submit', 'accept', 'end', 'kickoff', 'rebind',
  'trash', 'order', 'privacy', 'forward', 'trans', 'dislike', 'comment', 'complete',
  'edit', 'set', 'mark', 'audit', 'subscribe', 'unsubscribe', 'reply', 'logout',
]);
const sensitivePaths = new Set([
  '/login', '/login/cellphone', '/logout', '/fm_trash', '/daily_signin',
  '/comment', '/like', '/scrobble', '/resource/like',
]);
/** 需要选择本地文件并以 FormData 提交的接口 */
const fileRoutes = new Set([
  '/avatar/upload', '/cloud', '/voice/upload', '/cloud/upload/complete',
  '/playlist/cover/update', '/deviceinfo/center/upload',
]);

/* -------------------------------------------------------------------------- *
 * 参数 schema
 * 首选来源：server 自带的 interface.d.ts（含必填/可选、枚举、分页 mixin）。
 * 补充来源：module 源码里的 query.xxx 与 `query.xxx || 默认值`。
 * -------------------------------------------------------------------------- */
const dtsFile = path.join(repoRoot, 'cloud-music-server', 'interface.d.ts');
/** RequestBaseConfig 里的公共项，不作为业务参数渲染 */
const baseConfigFields = new Set(['cookie', 'proxy', 'realIP', 'randomCNIP', 'timeout', 'headers']);

/** 从花括号位置起取出配对块的内容（内部可嵌套 {}） */
const takeBlock = (text, start) => {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start + 1, i);
    }
  }
  return '';
};

/** 把 `{ a: string; b?: number }` 切成字段列表，跳过嵌套对象内部的分号 */
const splitFields = (body) => {
  const out = [];
  let buf = '';
  let depth = 0;
  const flush = () => {
    const text = buf.trim().replace(/;$/, '').trim();
    buf = '';
    const match = text.match(/^(\w+)(\?)?\s*:\s*([\s\S]+)$/);
    if (match) {
      out.push({
        name: match[1],
        optional: !!match[2],
        raw: match[3].trim().replace(/\s+/g, ' '),
      });
    }
  };
  for (const ch of `${body}\n`) {
    if ('{(<'.includes(ch)) depth += 1;
    else if ('})>'.includes(ch)) depth -= 1;
    if (depth === 0 && (ch === ';' || ch === '\n')) flush();
    else buf += ch;
  }
  return out;
};

const enums = new Map();
const interfaces = new Map();
const dtsParams = new Map();
if (fs.existsSync(dtsFile)) {
  const dts = fs.readFileSync(dtsFile, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  for (const match of dts.matchAll(/export (?:const )?enum (\w+)\s*\{/g)) {
    const body = takeBlock(dts, dts.indexOf('{', match.index));
    const options = [...body.matchAll(/(\w+)\s*=\s*('[^']*'|"[^"]*"|-?\d+)/g)]
      .map((item) => item[2].replace(/^['"]|['"]$/g, ''));
    enums.set(match[1], options);
  }
  for (const match of dts.matchAll(/export interface (\w+)\s*\{/g)) {
    interfaces.set(match[1], takeBlock(dts, dts.indexOf('{', match.index)));
  }
  for (const match of dts.matchAll(/export function (\w+)\(([\s\S]*?)\)\s*:\s*Promise<Response>/g)) {
    dtsParams.set(match[1], match[2]);
  }
}

/** 解析 params: { ... } & MultiPageConfig & RequestBaseConfig */
const parseDtsFields = (text) => {
  const fields = [];
  const brace = text.indexOf('{');
  if (brace >= 0) fields.push(...splitFields(takeBlock(text, brace)));
  for (const match of text.matchAll(/&\s*(\w+)/g)) {
    const name = match[1];
    if (name === 'RequestBaseConfig' || !interfaces.has(name)) continue;
    fields.push(...splitFields(interfaces.get(name)).map((field) => ({ ...field, from: name })));
  }
  const seen = new Set();
  return fields.filter((field) => !seen.has(field.name) && seen.add(field.name));
};

const normalizeType = (raw) => {
  if (/Buffer|File|Blob|songFile|imgFile/i.test(raw)) return 'file';
  if (/^boolean/.test(raw)) return 'boolean';
  if (/^\{/.test(raw)) return 'object';
  if (/^number/.test(raw) && !/string/.test(raw)) return 'number';
  if (/^string/.test(raw) && !/number/.test(raw)) return 'string';
  return 'mixed';
};

/** module 源码里 `query.xxx || 默认值` 提供 placeholder */
const collectHints = (source) => {
  const hints = new Map();
  for (const match of source.matchAll(/query\.([A-Za-z_$][\w$]*)\s*\|\|\s*('[^']*'|"[^"]*"|-?\d+)/g)) {
    hints.set(match[1], match[2].replace(/^['"]|['"]$/g, ''));
  }
  return hints;
};

const buildParams = (route) => {
  const source = fs.readFileSync(path.join(moduleDir, `${route.module}.js`), 'utf8');
  const hints = collectHints(source);
  const result = parseDtsFields(dtsParams.get(route.module) || '').map((field) => {
    const options = enums.get(field.raw);
    const param = {
      name: field.name,
      type: options ? 'enum' : normalizeType(field.raw),
      required: !field.optional,
      raw: field.raw,
    };
    if (options) param.options = options;
    if (hints.has(field.name)) param.hint = hints.get(field.name);
    return param;
  });
  const known = new Set(result.map((param) => param.name));
  // d.ts 没有覆盖到的参数，从源码补成可选字符串
  for (const match of source.matchAll(/query\.([A-Za-z_$][\w$]*)/g)) {
    const name = match[1];
    if (known.has(name) || baseConfigFields.has(name)) continue;
    known.add(name);
    const param = { name, type: 'string', required: false, raw: 'string' };
    if (hints.has(name)) param.hint = hints.get(name);
    result.push(param);
  }
  return result;
};

const routeParams = new Map(routes.map((route) => [route.path, buildParams(route)]));

const decorated = routes.map((route) => {
  const tail = route.path.split('/').pop() || '';
  return {
    ...route,
    kind: sensitivePaths.has(route.path) || writeTail.has(tail) ? 'write' : 'read',
    file: fileRoutes.has(route.path),
    existing: referenced.has(route.path),
  };
});

const byDomain = new Map();
for (const route of decorated) {
  const entry = byDomain.get(route.domain) || { name: route.domain, total: 0, added: 0 };
  entry.total += 1;
  if (!route.existing) entry.added += 1;
  byDomain.set(route.domain, entry);
}
const domains = [...byDomain.values()].sort((a, b) => a.name.localeCompare(b.name));
const total = decorated.length;
const existing = decorated.filter((route) => route.existing).length;
const added = total - existing;

/** 生成单引号字符串字面量并转义内部引号 */
const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const lines = decorated.map((route) =>
  `  { path: '${route.path}', module: '${route.module}', domain: '${route.domain}', ` +
  `kind: '${route.kind}', file: ${route.file}, existing: ${route.existing} },`,
);
const domainLines = domains.map((item) =>
  `  { name: '${item.name}', total: ${item.total}, added: ${item.added} },`,
);
const withParams = [...routeParams.values()].filter((list) => list.length > 0).length;
const paramCount = [...routeParams.values()].reduce((sum, list) => sum + list.length, 0);
const paramLines = [...routeParams.entries()]
  .filter(([, list]) => list.length > 0)
  .map(([routePath, list]) => {
    const items = list.map((param) => {
      const parts = [
        `name: ${quote(param.name)}`,
        `type: ${quote(param.type)}`,
        `required: ${param.required}`,
        `raw: ${quote(param.raw)}`,
      ];
      if (param.options) parts.push(`options: [${param.options.map(quote).join(', ')}]`);
      if (param.hint) parts.push(`hint: ${quote(param.hint)}`);
      return `{ ${parts.join(', ')} }`;
    });
    return `  ${quote(routePath)}: [${items.join(', ')}],`;
  });

const content = `/* 由 scripts/sync-server-routes.mjs 自动生成，请勿手工编辑。
 * 数据来源：cloud-music-server/module/*.js（server.js 按文件名自动注册路由）。
 * server 重新拉取代码后执行 npm run sync:routes 重新对齐。
 */

/** 服务端单条接口 */
export interface ServerRoute {
  /** 请求路径，与 server.js 注册的路由一致 */
  path: string;
  /** 服务端 module 文件名 */
  module: string;
  /** 按路径首段划分的功能域 */
  domain: string;
  /** write 表示会提交数据，页面需二次确认 */
  kind: 'read' | 'write';
  /** 是否需要选择本地文件并以 FormData 提交 */
  file: boolean;
  /** 生成时前端源码里是否已引用（已有页面接入） */
  existing: boolean;
}

/** 接口参数：解析自 interface.d.ts，缺失部分由 module 源码补齐 */
export interface ServerRouteParam {
  name: string;
  /** string / number / boolean / enum / file / object / mixed */
  type: string;
  required: boolean;
  /** 原始 TS 类型文本，用于输入提示 */
  raw: string;
  /** 枚举类型的可选值 */
  options?: string[];
  /** 源码里的默认值，用作 placeholder */
  hint?: string;
}

/** 服务端全部接口（共 ${total} 条） */
export const SERVER_ROUTES: ServerRoute[] = [
${lines.join('\n')}
];

/** 按功能域汇总，供总览页筛选用 */
export const ROUTE_DOMAINS: { name: string; total: number; added: number }[] = [
${domainLines.join('\n')}
];

/** 每条接口的参数定义（共 ${paramCount} 个参数，覆盖 ${withParams} 条接口） */
export const ROUTE_PARAMS: Record<string, ServerRouteParam[]> = {
${paramLines.join('\n')}
};

/** 对齐快照：total 与 server module 文件数一致 */
export const ROUTE_STATS = {
  total: ${total},
  existing: ${existing},
  added: ${added},
  domains: ${domains.length},
  withParams: ${withParams},
  paramCount: ${paramCount},
  enums: ${enums.size},
} as const;
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, content, 'utf8');
console.log(`[sync-routes] 已生成 ${path.relative(repoRoot, outFile)}`);
console.log(`[sync-routes] 服务端 ${total} 条 / 已接入 ${existing} 条 / 新增对齐 ${added} 条 / ${domains.length} 个功能域`);
console.log(`[sync-routes] 参数 schema：${withParams} 条接口 / ${paramCount} 个参数 / ${enums.size} 个枚举（来源 interface.d.ts + module 源码）`);
