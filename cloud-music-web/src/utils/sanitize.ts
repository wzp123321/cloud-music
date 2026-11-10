/**
 * 轻量 HTML 清洗：仅移除 XSS 高危节点与属性，保留富文本正常结构。
 * 用于 v-html 渲染服务端/本地生成的富文本（评论、歌词、歌手简介）。
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
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (
        (name === 'href' || name === 'src') &&
        /^(javascript|data):/i.test(attr.value.trim())
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
};
