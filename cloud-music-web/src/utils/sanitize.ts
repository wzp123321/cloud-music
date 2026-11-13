/**
 * 轻量 HTML 清洗：仅保留富文本正常结构，移除 XSS 高危节点与属性。
 * 用于 v-html 渲染服务端/本地生成的富文本（评论、歌词、歌手简介）。
 *
 * 注意：自研清洗仅作兜底。已覆盖 formaction / xlink:href / style / vbscript: 等
 * 常见绕过面；如条件允许，建议直接引入 DOMPurify 替代本实现。
 */
const FORBIDDEN_TAGS = new Set([
  'SCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'LINK',
  'STYLE',
  'META',
  'BASE',
  'FORM',
  'INPUT',
  'TEXTAREA',
  // inert DOM（template/noscript）序列化后可能被重新激活执行，需整节点移除
  'TEMPLATE',
  'NOSCRIPT',
]);

// 需要整属性移除的高危属性（无论取值）
const DANGEROUS_ATTR_NAMES = new Set(['formaction', 'xlink:href', 'style']);
// 承载 URL、需要做协议检测的属性白名单（含 srcset 等多候选值属性）
const URL_ATTR_NAMES = new Set([
  'href',
  'src',
  'xlink:href',
  'srcset',
  'poster',
  'background',
  'cite',
  'action',
  'data',
  'longdesc',
  'formaction',
]);
// 危险协议前缀
const DANGEROUS_PROTOCOL = /^(javascript|vbscript|data):/i;

// 常见命名实体：覆盖 &colon; / &Tab; / &NewLine; 等拆分协议关键字的混淆写法
const NAMED_ENTITIES: Record<string, string> = {
  colon: ':',
  Tab: '\t',
  NewLine: '\n',
  sol: '/',
  bsol: '\\',
};
// 解码数字实体（十进制 / 十六进制）与命名实体，供协议检测前归一化
const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&#x([0-9a-f]+);?/gi, (_m: string, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);?/gi, (_m: string, dec: string) =>
      String.fromCharCode(parseInt(dec, 10)),
    )
    .replace(/&([a-zA-Z]+);/g, (m: string, name: string) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : m,
    );

// 协议归一化：先解码 HTML 实体，再剔除 \x00-\x20 控制字符，
// 防 `java&#9;script:` / `javascript&colon;alert(1)` 之类绕过前缀匹配
const normalizeProtocolValue = (value: string): string =>
  decodeHtmlEntities(value).replace(/[\x00-\x20]/g, ''); // eslint-disable-line no-control-regex

const hasDangerousProtocol = (value: string): boolean =>
  DANGEROUS_PROTOCOL.test(normalizeProtocolValue(value));

// srcset 以逗号分隔多个候选（url + 描述符），任一项命中危险协议即整属性移除
const hasDangerousSrcset = (value: string): boolean =>
  value.split(',').some((candidate) => hasDangerousProtocol(candidate));

export const sanitizeHtml = (html: unknown): string => {
  if (typeof html !== 'string') return '';
  if (typeof window === 'undefined' || !window.DOMParser) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('*').forEach((el) => {
    if (FORBIDDEN_TAGS.has(el.tagName)) {
      el.remove();
      return;
    }
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const isEvent = name.startsWith('on');
      const isDangerousName = DANGEROUS_ATTR_NAMES.has(name);
      const isUriWithDangerousProtocol =
        URL_ATTR_NAMES.has(name) &&
        (name === 'srcset'
          ? hasDangerousSrcset(attr.value)
          : hasDangerousProtocol(attr.value));
      if (isEvent || isDangerousName || isUriWithDangerousProtocol) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
};
