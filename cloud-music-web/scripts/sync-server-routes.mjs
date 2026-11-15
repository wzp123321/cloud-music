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
      // 跳过生成目录：否则上一版 routes.ts 里的路径会被算成「已被页面接入」
      if (full === outDir) continue;
      walk(full);
    } else if (/\.(ts|vue|js)$/.test(entry.name)) {
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

const lines = decorated.map((route) =>
  `  { path: '${route.path}', module: '${route.module}', domain: '${route.domain}', ` +
  `kind: '${route.kind}', file: ${route.file}, existing: ${route.existing} },`,
);
const domainLines = domains.map((item) =>
  `  { name: '${item.name}', total: ${item.total}, added: ${item.added} },`,
);

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

/** 服务端全部接口（共 ${total} 条） */
export const SERVER_ROUTES: ServerRoute[] = [
${lines.join('\n')}
];

/** 按功能域汇总，供总览页筛选用 */
export const ROUTE_DOMAINS: { name: string; total: number; added: number }[] = [
${domainLines.join('\n')}
];

/** 对齐快照：total 与 server module 文件数一致 */
export const ROUTE_STATS = {
  total: ${total},
  existing: ${existing},
  added: ${added},
  domains: ${domains.length},
} as const;
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, content, 'utf8');
console.log(`[sync-routes] 已生成 ${path.relative(repoRoot, outFile)}`);
console.log(`[sync-routes] 服务端 ${total} 条 / 已接入 ${existing} 条 / 新增对齐 ${added} 条 / ${domains.length} 个功能域`);
