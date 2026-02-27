import React from 'react';
import DOMPurify from 'dompurify';
import parse, { domToReact } from 'html-react-parser';

const sanitizeCfg = {
  ADD_ATTR: ['target', 'rel', 'style', 'class', 'data-widthpct', 'data-alignmode'],
  ADD_TAGS: ['iframe'],
};

/**
 * Converts a CSS style string to a React-compatible style object.
 */
const parseStyleString = (styleStr) => {
  if (!styleStr || typeof styleStr !== 'string') return undefined;
  const obj = {};
  styleStr.split(';').forEach((pair) => {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value) {
      // camelCase the CSS property name
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      obj[camelKey] = value;
    }
  });
  return Object.keys(obj).length > 0 ? obj : undefined;
};

export default function HtmlContent({ html, className = 'cms-content prose max-w-none' }) {
  const safe = React.useMemo(() => DOMPurify.sanitize(html || '', sanitizeCfg), [html]);
  const options = {
    replace: (node) => {
      if (node.type === 'tag' && node.name === 'a') {
        const href = node.attribs?.href || '';
        const external = /^https?:\/\//i.test(href);
        const props = {
          ...node.attribs,
          style: parseStyleString(node.attribs?.style),
          rel: node.attribs?.rel || (external ? 'noopener noreferrer' : undefined),
          target: node.attribs?.target || (external ? '_blank' : undefined),
        };
        return <a {...props}>{domToReact(node.children, options)}</a>;
      }
      return undefined;
    },
  };
  return <div className={className}>{parse(safe, options)}</div>;
}