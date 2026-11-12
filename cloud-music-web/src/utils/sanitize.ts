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
]);

// 需要整属性移除的高危属性（无论取值）
const DANGEROUS_ATTR_NAMES = new Set(['formaction', 'xlink:href', 'style']);
// 危险协议前缀
const DANGEROUS_PROTOCOL = /^(javascript|vbscript|data):/i;

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
        (name === 'href' || name === 'src' || name === 'xlink:href') &&
        DANGEROUS_PROTOCOL.test(attr.value.trim());
      if (isEvent || isDangerousName || isUriWithDangerousProtocol) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
};
