#!/usr/bin/env node
/* eslint-disable no-console, no-undef, no-useless-escape */
/**
 * 静态回归校验（零依赖 Node ESM）
 *
 * 覆盖四类易复发问题：
 *  1. cm-*-card 卡片根 <div> 漏 @click（卡片点了没反应）
 *  2. header.vue 登录态下拉菜单 <li> 漏 @click（死链）
 *  3. 已登记失效的接口重新进入 blocks.ts 主流程（死接口回流）
 *  4. 字面量路由 path 在 router/modules/*.ts 中找不到（死链）
 *
 * 用 import.meta.url 定位前端根目录，不依赖 cwd；任一条失败即 exit(1)。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/ 的上一级即前端根目录
const webRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const srcRoot = join(webRoot, 'src');

const failures = [];
const summary = [];

const rel = (file) => relative(webRoot, file).split(sep).join('/');
const read = (file) => readFileSync(file, 'utf8');
const isFile = (file) => {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
};

// 递归收集源码文件（排除 .d.ts 声明文件，避免无关匹配）
const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx|js|jsx|vue)$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
};

// 取 SFC 的 <template> 文本
const templateOf = (text) => {
  const m = text.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  return m ? m[1] : '';
};

// ---------------------------------------------------------------- 断言 1：卡片点击
const checkCards = () => {
  const componentDir = join(srcRoot, 'components');
  const cardFiles = readdirSync(componentDir)
    .filter((name) => /^cm-.+-card$/.test(name))
    .map((name) => join(componentDir, name, `${name}.vue`))
    .filter(isFile);

  if (cardFiles.length === 0) {
    failures.push('[卡片点击] 未找到任何 src/components/cm-*-card/*.vue，请检查脚本定位');
    return;
  }
  let ok = 0;
  for (const file of cardFiles) {
    const rootDiv = templateOf(read(file)).match(/<div\b[^>]*>/);
    if (!rootDiv) {
      failures.push(`[卡片点击] 找不到根 <div>：${rel(file)}`);
      continue;
    }
    if (!/@click/.test(rootDiv[0])) {
      failures.push(`[卡片点击] 根 <div> 缺少 @click：${rel(file)} → ${rootDiv[0].trim()}`);
    } else {
      ok += 1;
    }
  }
  summary.push(`[卡片点击] 通过 ${ok}/${cardFiles.length} 个卡片根 <div> 带 @click`);
};

// ---------------------------------------------------------------- 断言 2：登录态下拉菜单
const checkHeaderMenu = () => {
  const file = join(srcRoot, 'views', 'header', 'header.vue');
  if (!isFile(file)) {
    failures.push(`[下拉菜单] 找不到 ${rel(file)}`);
    return;
  }
  // 登录态下拉 = <el-popover> ... </el-popover> 区块
  const popover = read(file).match(/<el-popover\b[^>]*>([\s\S]*?)<\/el-popover>/);
  if (!popover) {
    failures.push('[下拉菜单] 未在 header.vue 找到 <el-popover> 登录态下拉区块');
    return;
  }
  const items = popover[1].match(/<li\b[^>]*>/g) ?? [];
  if (items.length === 0) {
    failures.push('[下拉菜单] 登录态下拉区块内未找到任何 <li>');
    return;
  }
  let ok = 0;
  items.forEach((tag, i) => {
    if (!/@click/.test(tag)) {
      failures.push(`[下拉菜单] 第 ${i + 1} 个 <li> 缺少 @click：${tag.trim()}`);
    } else {
      ok += 1;
    }
  });
  summary.push(`[下拉菜单] 通过 ${ok}/${items.length} 个登录态 <li> 带 @click`);
};

// ---------------------------------------------------------------- 断言 3：失效接口
const INVALID_APIS = [
  '/top/list',
  '/yunbei/info',
  '/summary/annual',
  '/verify/getQr',
  '/user/cloud/detail',
  '/pl/count',
  '/playmode/intelligence/list',
];

// 取 url 所在对象区块：向上到最近 module: 字段（多带 2 行注释），向下到块级结束行
const blockAround = (lines, idx) => {
  let start = -1;
  for (let i = idx; i >= 0 && i > idx - 30; i -= 1) {
    if (/\bmodule\s*:/.test(lines[i])) {
      start = i;
      break;
    }
  }
  start = start === -1 ? Math.max(0, idx - 6) : Math.max(0, start - 2);
  let end = Math.min(lines.length - 1, idx + 30);
  for (let i = idx; i < lines.length && i < idx + 30; i += 1) {
    // 块级结束行：恰好 2 空格缩进的 `}` / `},`（函数体内 4 空格缩进不算）
    if (lines[i].startsWith('  }')) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end + 1).join('\n');
};

const checkInvalidApis = () => {
  const blockFiles = walk(join(srcRoot, 'views')).filter((f) => f.endsWith('.blocks.ts'));
  let ok = 0;
  let seen = 0;
  for (const file of blockFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // 注释里的接口路径不算「进入主流程」，跳过
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      for (const api of INVALID_APIS) {
        if (!line.includes(api)) continue;
        seen += 1;
        const block = blockAround(lines, idx);
        // 同区块须明确标注 invalid 或「失效」，否则视为死接口回流主流程
        if (/invalid|失效/i.test(block)) {
          ok += 1;
        } else {
          failures.push(
            `[失效接口] ${rel(file)}:${idx + 1} 出现 ${api}，但同区块缺少 invalid/「失效」标记`,
          );
        }
      }
    });
  }
  summary.push(`[失效接口] 通过 ${ok}/${seen} 处失效接口（扫描 ${blockFiles.length} 个 blocks.ts）`);
};

// ---------------------------------------------------------------- 断言 4：字面量路由
const checkLiteralRoutes = () => {
  const moduleDir = join(srcRoot, 'router', 'modules');
  const defined = new Set();
  for (const name of readdirSync(moduleDir).filter((n) => n.endsWith('.ts'))) {
    const text = read(join(moduleDir, name));
    for (const m of text.matchAll(/\bpath\s*:\s*['"]([^'"]+)['"]/g)) {
      defined.add(m[1]);
    }
  }
  if (defined.size === 0) {
    failures.push('[字面量路由] router/modules/*.ts 未解析出任何 path，请检查脚本定位');
    return;
  }

  let ok = 0;
  let seen = 0;
  for (const file of walk(srcRoot)) {
    const text = read(file);
    // path: '/xxx'（含 router.push({ path: '/xxx' })）与 router.push('/xxx') 两类字面量
    const literals = [];
    for (const m of text.matchAll(/\bpath\s*:\s*['"]([^'"]+)['"]/g)) literals.push(m[1]);
    for (const m of text.matchAll(/router\.push\s*\(\s*['"]([^'"]+)['"]/g)) literals.push(m[1]);
    for (const value of literals) {
      // 动态变量路径不会被上述正则匹配；仅校验以 / 开头的字面量路由
      if (!value.startsWith('/')) continue;
      seen += 1;
      if (defined.has(value)) {
        ok += 1;
      } else {
        failures.push(`[字面量路由] ${rel(file)} 的 '${value}' 在 router/modules/*.ts 中无对应 path`);
      }
    }
  }
  summary.push(`[字面量路由] 通过 ${ok}/${seen} 条字面量路由（对照 ${defined.size} 个已注册 path）`);
};

checkCards();
checkHeaderMenu();
checkInvalidApis();
checkLiteralRoutes();

console.log('== 静态回归校验 ==');
for (const line of summary) console.log(`  ${line}`);

if (failures.length > 0) {
  console.error(`\n校验失败，共 ${failures.length} 条：`);
  failures.forEach((msg, i) => console.error(`  ${i + 1}. ${msg}`));
  process.exit(1);
}
console.log(`\n全部通过，共 ${summary.length} 组断言。`);
