import React from 'react';
import uploadAdminMedia from '../../utils/uploadMedia';
import { absoluteUrl } from '../../../utils/media';
import '../../../styles/quill-overrides.css';

const resolveAssetUrl = (url) => {
  const resolved = absoluteUrl(url);
  if (resolved) return resolved;
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (url.startsWith('/')) return `${window.location.origin}${url}`;
    return `${window.location.origin}/${url}`;
  }
  return url;
};

const FONT_WHITELIST = ['inter', 'redhatdisplay'];
const SIZE_WHITELIST = ['small', false, 'large', 'huge'];

// ── Icon components (inline SVG, no deps) ──
const Icon = ({ d, size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const AlignLeftIcon = () => <Icon d="M3 6h18M3 12h12M3 18h15" />;
const AlignCenterIcon = () => <Icon d="M3 6h18M6 12h12M4 18h16" />;
const AlignRightIcon = () => <Icon d="M3 6h18M9 12h12M6 18h15" />;
const AlignInlineIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <path d="M14 6h7M14 12h7M3 18h18" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.4 5 12 5 12 5s-4.4 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.4 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9l5.3 2.8-5.3 2.7z" />
  </svg>
);

const ButtonIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="10" rx="4" />
    <path d="M8 12h8" />
  </svg>
);

const AccordionIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M3 10h18M7 14l5 5 5-5" />
  </svg>
);

const EyeIcon = ({ open }) => open
  ? <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  : <Icon d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />;

export default function RichText({ value, onChange, placeholder = 'Type here…', height = 260, gallery = [] }) {
  const ref = React.useRef({ Editor: null });
  const quillRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const [, force] = React.useReducer((x) => x + 1, 0);
  const [uploading, setUploading] = React.useState(false);
  const [uploadErr, setUploadErr] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [imageWidth, setImageWidth] = React.useState(100);
  const dragStateRef = React.useRef({ index: null, src: null });
  const [editorReady, setEditorReady] = React.useState(false);
  const [dragHint, setDragHint] = React.useState(null);
  const fontSetupRef = React.useRef(false);
  const [imageAlignment, setImageAlignment] = React.useState('inline');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [imageAltEdit, setImageAltEdit] = React.useState('');

  // ── Modal states ──
  const [altModal, setAltModal] = React.useState(null);
  const [ytModal, setYtModal] = React.useState(false);
  const [btnModal, setBtnModal] = React.useState(false);
  const [accModal, setAccModal] = React.useState(false);
  const [accTitle, setAccTitle] = React.useState('');
  const [accContent, setAccContent] = React.useState('');
  const [ytUrl, setYtUrl] = React.useState('');
  const [btnText, setBtnText] = React.useState('');
  const [btnLink, setBtnLink] = React.useState('');
  const [btnPadding, setBtnPadding] = React.useState('10px 24px');
  const [btnMargin, setBtnMargin] = React.useState('1rem 0');
  const [btnBg, setBtnBg] = React.useState('#2563eb');
  const [btnColor, setBtnColor] = React.useState('#ffffff');
  const [btnRadius, setBtnRadius] = React.useState('8px');

  const handleYouTubeInsert = React.useCallback(() => { setYtUrl(''); setYtModal(true); }, []);
  const handleButtonInsert = React.useCallback(() => { setBtnText(''); setBtnLink(''); setBtnModal(true); }, []);
  const handleAccordionInsert = React.useCallback(() => { setAccTitle(''); setAccContent(''); setAccModal(true); }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod2 = await import('react-quill-new');
        try { await import('react-quill-new/dist/quill.snow.css'); } catch { }
        if (mounted) {
          const EditorComponent = mod2.default || mod2;
          const QuillCtor = mod2.Quill || window.Quill;
          if (QuillCtor && !fontSetupRef.current) {
            const AlignStyle = QuillCtor.import('attributors/style/align');
            QuillCtor.register(AlignStyle, true);
            const SizeStyle = QuillCtor.import('attributors/style/size');
            SizeStyle.whitelist = SIZE_WHITELIST;
            QuillCtor.register(SizeStyle, true);
            const ColorStyle = QuillCtor.import('attributors/style/color');
            QuillCtor.register(ColorStyle, true);
            const BackgroundStyle = QuillCtor.import('attributors/style/background');
            QuillCtor.register(BackgroundStyle, true);
            const Font = QuillCtor.import?.('formats/font');
            if (Font) { Font.whitelist = FONT_WHITELIST; QuillCtor.register(Font, true); }
            fontSetupRef.current = true;
          }
          ref.current.Editor = EditorComponent;
          force();
          setEditorReady(true);
        }
      } catch (e) {
        console.warn('RichText: editor not available.', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (!editorReady) return;
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      delta.ops.forEach((op) => {
        if (op.attributes) {
          if (op.attributes.background) delete op.attributes.background;
          if (op.attributes.color) {
            const color = op.attributes.color.toLowerCase().replace(/\s/g, '');
            if (['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(color)) delete op.attributes.color;
          }
        }
      });
      return delta;
    });
  }, [editorReady]);

  const handleSelectImage = React.useCallback(() => { setUploadErr(''); fileInputRef.current?.click(); }, []);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      setUploadErr('');
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      for (const file of files) {
        const altText = await new Promise((resolve) => { setAltModal({ file, resolve }); });
        const url = await uploadAdminMedia(file, { folder: 'editor' });
        const range = quill.getSelection(true);
        const insertAt = range ? range.index : quill.getLength();
        const imageUrl = resolveAssetUrl(url);
        quill.insertEmbed(insertAt, 'image', imageUrl, 'user');
        const imgNode = quill.root.querySelector(`img[src="${imageUrl}"]`);
        if (imgNode && altText) imgNode.setAttribute('alt', altText);
        quill.setSelection(insertAt + 1);
      }
    } catch (err) {
      setUploadErr(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const confirmYouTube = () => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill || !ytUrl.trim()) { setYtModal(false); return; }
    let videoId = '';
    try {
      const url = new URL(ytUrl.trim());
      if (url.hostname.includes('youtu.be')) videoId = url.pathname.slice(1);
      else videoId = url.searchParams.get('v') || '';
    } catch { videoId = ytUrl.trim(); }
    if (!videoId) { setYtModal(false); return; }
    const range = quill.getSelection(true);
    const insertAt = range ? range.index : quill.getLength();
    const embedHtml = `<div class="yt-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1rem 0;border-radius:12px;"><iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
    quill.clipboard.dangerouslyPasteHTML(insertAt, embedHtml, 'user');
    quill.setSelection(insertAt + 1);
    setYtModal(false);
    setYtUrl('');
  };

  const confirmButton = () => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill || !btnText.trim() || !btnLink.trim()) { setBtnModal(false); return; }
    const range = quill.getSelection(true);
    const insertAt = range ? range.index : quill.getLength();
    const style = `display:inline-block;padding:${btnPadding};margin:${btnMargin};background:${btnBg};color:${btnColor};border-radius:${btnRadius};text-decoration:none;font-weight:600;font-size:14px;`;
    const buttonHtml = `<p><a href="${btnLink.trim()}" target="_blank" rel="noopener noreferrer" style="${style}">${btnText.trim()}</a></p>`;
    quill.clipboard.dangerouslyPasteHTML(insertAt, buttonHtml, 'user');
    quill.setSelection(insertAt + 1);
    setBtnModal(false);
  };

  const confirmAccordion = () => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill || !accTitle.trim()) { setAccModal(false); return; }
    const range = quill.getSelection(true);
    const insertAt = range ? range.index : quill.getLength();
    const accordionHtml = `
      <details class="cms-accordion" style="border:1px solid #e5e7eb;border-radius:12px;margin:1rem 0;overflow:hidden;">
        <summary style="padding:1rem;background:#f9fafb;font-weight:600;cursor:pointer;list-style:none;">${accTitle.trim()}</summary>
        <div class="cms-accordion-content" style="padding:1rem;border-top:1px solid #e5e7eb;">${accContent.trim() || 'Content goes here...'}</div>
      </details>
      <p><br></p>
    `;
    quill.clipboard.dangerouslyPasteHTML(insertAt, accordionHtml, 'user');
    quill.setSelection(insertAt + 2);
    setAccModal(false);
  };

  const insertImageUrl = React.useCallback(async (url) => {
    try {
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      const range = quill.getSelection(true);
      const insertAt = range ? range.index : quill.getLength();
      quill.insertEmbed(insertAt, 'image', resolveAssetUrl(url), 'user');
      quill.setSelection(insertAt + 1);
    } catch (err) { console.error('Insert image failed', err); }
  }, []);

  const applyWidth = React.useCallback((node, pct) => {
    if (!node) return;
    const clamped = Math.min(100, Math.max(20, pct));
    node.style.width = `${clamped}%`;
    node.style.maxWidth = '100%';
    node.dataset.widthPct = String(clamped);
  }, []);

  const applyAlignment = React.useCallback((node, mode) => {
    if (!node) return;
    const align = mode || 'inline';
    node.dataset.alignMode = align;
    node.style.float = '';
    node.style.display = '';
    node.style.margin = node.style.marginLeft = node.style.marginRight = node.style.marginTop = node.style.marginBottom = '';
    if (align === 'left') { node.style.float = 'left'; node.style.margin = '0 1rem 1rem 0'; node.style.display = 'block'; }
    else if (align === 'right') { node.style.float = 'right'; node.style.margin = '0 0 1rem 1rem'; node.style.display = 'block'; }
    else if (align === 'center') { node.style.display = 'block'; node.style.marginLeft = 'auto'; node.style.marginRight = 'auto'; node.style.marginBottom = '1rem'; }
    else { node.style.display = 'inline-block'; node.style.marginBottom = '1rem'; }
  }, []);

  const onSelectionChange = React.useCallback((range) => {
    if (!range) { setSelectedImage(null); setImageWidth(100); setImageAlignment('inline'); return; }
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    const [leaf] = quill.getLeaf(range.index);
    if (leaf?.domNode?.tagName === 'IMG') {
      setSelectedImage(leaf.domNode);
      const pct = Number(leaf.domNode.dataset.widthPct || 100);
      setImageWidth(Number.isFinite(pct) ? pct : 100);
      setImageAlignment(leaf.domNode.dataset.alignMode || 'inline');
      setImageAltEdit(leaf.domNode.getAttribute('alt') || '');
    } else {
      setSelectedImage(null);
      setImageAlignment('inline');
    }
  }, []);

  const onWidthChange = (pct) => { setImageWidth(pct); applyWidth(selectedImage, pct); };
  const onAlignmentChange = (mode) => { setImageAlignment(mode); applyAlignment(selectedImage, mode); };
  const onAltChange = (alt) => { setImageAltEdit(alt); if (selectedImage) selectedImage.setAttribute('alt', alt); };

  React.useEffect(() => {
    if (!selectedImage) return;
    applyWidth(selectedImage, imageWidth);
    applyAlignment(selectedImage, imageAlignment);
  }, [selectedImage, imageWidth, imageAlignment, applyWidth, applyAlignment]);

  React.useEffect(() => {
    if (!editorReady) return undefined;
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return undefined;
    const root = quill.root;
    const getRangeFromPoint = (event) => {
      if (document.caretRangeFromPoint) return document.caretRangeFromPoint(event.clientX, event.clientY);
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) { const r = document.createRange(); r.setStart(pos.offsetNode, pos.offset); r.collapse(true); return r; }
      }
      return null;
    };
    const handleDragStart = (event) => {
      if (event.target?.tagName !== 'IMG') return;
      const qi = quillRef.current?.getEditor?.();
      if (!qi) return;
      const blot = qi.constructor.find(event.target, true);
      if (!blot) return;
      dragStateRef.current = { index: qi.getIndex(blot), src: event.target.getAttribute('src') };
      event.dataTransfer?.setData('text/plain', 'drag-image');
      event.dataTransfer?.setDragImage(event.target, event.target.width / 2, event.target.height / 2);
    };
    const handleDragOver = (event) => { if (dragStateRef.current.src) event.preventDefault(); };
    const handleDrop = (event) => {
      const { index: fromIndex, src } = dragStateRef.current;
      if (fromIndex == null || !src) return;
      event.preventDefault();
      const qi = quillRef.current?.getEditor?.();
      if (!qi) return;
      const range = getRangeFromPoint(event);
      let insertIndex = qi.getLength();
      if (range) { const blot = qi.constructor.find(range.startContainer, true); if (blot) insertIndex = qi.getIndex(blot); }
      let targetIndex = insertIndex;
      if (targetIndex > fromIndex) targetIndex -= 1;
      qi.deleteText(fromIndex, 1, 'user');
      qi.insertEmbed(targetIndex, 'image', src, 'user');
      qi.setSelection(targetIndex + 1, 0, 'user');
      dragStateRef.current = { index: null, src: null };
    };
    const handleMouseOver = (event) => {
      if (event.target?.tagName !== 'IMG') return;
      event.target.setAttribute('draggable', 'true');
      const ir = event.target.getBoundingClientRect();
      const wr = wrapperRef.current?.getBoundingClientRect();
      if (!wr) return;
      setDragHint({ left: ir.left - wr.left + wrapperRef.current.scrollLeft, top: ir.top - wr.top + wrapperRef.current.scrollTop - 32, width: ir.width });
    };
    const handleMouseOut = (event) => { if (event.target?.tagName === 'IMG') setDragHint(null); };
    root.addEventListener('dragstart', handleDragStart);
    root.addEventListener('dragover', handleDragOver);
    root.addEventListener('drop', handleDrop);
    root.addEventListener('mouseover', handleMouseOver);
    root.addEventListener('mouseout', handleMouseOut);
    return () => {
      root.removeEventListener('dragstart', handleDragStart);
      root.removeEventListener('dragover', handleDragOver);
      root.removeEventListener('drop', handleDrop);
      root.removeEventListener('mouseover', handleMouseOver);
      root.removeEventListener('mouseout', handleMouseOut);
    };
  }, [editorReady]);

  const modules = React.useMemo(() => ({
    toolbar: {
      container: [
        [{ font: FONT_WHITELIST }],
        [{ size: SIZE_WHITELIST }],
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ script: 'sub' }, { script: 'super' }],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote', 'code-block'],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: { image: handleSelectImage, video: handleYouTubeInsert }
    },
    clipboard: { matchVisual: false }
  }), [handleSelectImage, handleYouTubeInsert]);

  const EditorComponent = ref.current.Editor;

  if (!EditorComponent) {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: height }}
        className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200"
      />
    );
  }

  // ── Alignment button config ──
  const alignOptions = [
    { mode: 'inline', label: 'Inline', Icon: AlignInlineIcon },
    { mode: 'left', label: 'Left', Icon: AlignLeftIcon },
    { mode: 'center', label: 'Center', Icon: AlignCenterIcon },
    { mode: 'right', label: 'Right', Icon: AlignRightIcon },
  ];

  return (
    <div ref={wrapperRef} className="richtext-wrapper">
      {/* ── Styles ── */}
      <style>{`
        .richtext-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          border-radius: 12px;
          overflow: visible;
        }

        /* ── Quill editor ── */
        .richtext-wrapper .ql-container {
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          border-color: #e2e8f0;
        }
        .richtext-wrapper .ql-toolbar {
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          border-color: #e2e8f0;
          background: #f8fafc;
          padding: 6px 8px;
        }
        .richtext-wrapper .ql-toolbar .ql-formats {
          margin-right: 6px;
        }
        .richtext-wrapper .ql-editor {
          min-height: ${height}px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          line-height: 1.8;
          color: #1e293b;
          caret-color: #3b82f6;
        }
        .richtext-wrapper .ql-editor p { margin-bottom: 1.5rem !important; }
        .richtext-wrapper .ql-editor h1, .richtext-wrapper .ql-editor h2, .richtext-wrapper .ql-editor h3 {
          font-family: 'Red Hat Display', sans-serif;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2.5rem !important;
          margin-bottom: 1.25rem !important;
        }
        .richtext-wrapper .ql-editor h1 { font-size: 2.25rem; }
        .richtext-wrapper .ql-editor h2 { font-size: 1.75rem; }
        .richtext-wrapper .ql-editor h3 { font-size: 1.35rem; }
        .richtext-wrapper .ql-editor ul, .richtext-wrapper .ql-editor ol { margin-bottom: 1.5rem; }
        .richtext-wrapper .ql-tooltip { z-index: 10000 !important; }

        /* ── Toolbar bar (secondary) ── */
        .rt-toolbar-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: #f1f5f9;
          border-left: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .rt-toolbar-bar-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .rt-insert-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          white-space: nowrap;
          line-height: 1;
        }
        .rt-insert-btn:hover { background: rgba(0,0,0,0.05); }
        .rt-insert-btn.yt { color: #dc2626; border-color: #fca5a5; }
        .rt-insert-btn.yt:hover { background: #fff1f1; }
        .rt-insert-btn.btn { color: #2563eb; border-color: #93c5fd; }
        .rt-insert-btn.btn:hover { background: #eff6ff; }
        .rt-insert-btn.acc { color: #059669; border-color: #6ee7b7; }
        .rt-insert-btn.acc:hover { background: #ecfdf5; }
        .rt-preview-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          color: #475569;
          transition: background 0.15s;
        }
        .rt-preview-btn:hover { background: #f8fafc; }
        .rt-preview-btn.active { background: #0f172a; color: white; border-color: #0f172a; }

        /* ── Gallery ── */
        .rt-gallery {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          overflow-x: auto;
        }
        .rt-gallery-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          white-space: nowrap;
          margin-right: 4px;
        }
        .rt-gallery-thumb {
          width: 52px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          border: 1.5px solid #e2e8f0;
          cursor: pointer;
          transition: border-color 0.15s, transform 0.15s;
          background: #f1f5f9;
        }
        .rt-gallery-thumb:hover { border-color: #3b82f6; transform: scale(1.05); }

        /* ── Image controls ── */
        .rt-image-panel {
          border: 1.5px solid #bfdbfe;
          border-radius: 10px;
          background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
          overflow: hidden;
          animation: rt-slide-down 0.18s ease-out;
        }
        @keyframes rt-slide-down {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rt-image-panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #dbeafe;
          border-bottom: 1px solid #bfdbfe;
        }
        .rt-image-panel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3b82f6;
          flex-shrink: 0;
        }
        .rt-image-panel-title {
          font-size: 12px;
          font-weight: 600;
          color: #1d4ed8;
          letter-spacing: 0.02em;
        }
        .rt-image-panel-body {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rt-panel-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
          margin-bottom: 5px;
        }

        /* ── Alt text input ── */
        .rt-alt-input {
          width: 100%;
          padding: 7px 10px;
          border-radius: 7px;
          border: 1.5px solid #bfdbfe;
          background: white;
          font-size: 13px;
          color: #1e293b;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .rt-alt-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        .rt-alt-input::placeholder { color: #94a3b8; }

        /* ── Width slider ── */
        .rt-width-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rt-width-badge {
          flex-shrink: 0;
          min-width: 42px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #1d4ed8;
          background: #dbeafe;
          border-radius: 5px;
          padding: 2px 6px;
        }
        .rt-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 4px;
          border-radius: 9999px;
          background: linear-gradient(to right, #3b82f6 0%, #3b82f6 var(--progress, 100%), #bfdbfe var(--progress, 100%), #bfdbfe 100%);
          outline: none;
          cursor: pointer;
        }
        .rt-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2.5px solid #3b82f6;
          box-shadow: 0 1px 4px rgba(59,130,246,0.4);
          cursor: pointer;
          transition: transform 0.1s;
        }
        .rt-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .rt-width-presets {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .rt-width-preset-btn {
          padding: 3px 9px;
          border-radius: 5px;
          border: 1px solid #bfdbfe;
          background: white;
          font-size: 11px;
          font-weight: 500;
          color: #3b82f6;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
        }
        .rt-width-preset-btn:hover { background: #eff6ff; border-color: #93c5fd; }

        /* ── Alignment pills ── */
        .rt-align-group {
          display: flex;
          gap: 4px;
          background: white;
          border: 1.5px solid #bfdbfe;
          border-radius: 8px;
          padding: 3px;
        }
        .rt-align-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 6px;
          border-radius: 5px;
          border: none;
          background: transparent;
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          white-space: nowrap;
        }
        .rt-align-btn:hover { background: #f1f5f9; color: #334155; }
        .rt-align-btn.active {
          background: #3b82f6;
          color: white;
          box-shadow: 0 1px 3px rgba(59,130,246,0.4);
        }

        /* ── Preview ── */
        .rt-preview-panel {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          overflow: hidden;
        }
        .rt-preview-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          padding: 8px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .rt-preview-body {
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.75;
          color: #1e293b;
        }

        /* ── Upload state ── */
        .rt-upload-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          font-size: 12px;
          color: #2563eb;
        }
        .rt-upload-spinner {
          width: 14px; height: 14px;
          border: 2px solid #bfdbfe;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: rt-spin 0.7s linear infinite;
        }
        @keyframes rt-spin { to { transform: rotate(360deg); } }
        .rt-error-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          font-size: 12px;
          color: #dc2626;
        }

        /* ── Drag hint ── */
        .rt-drag-hint {
          pointer-events: none;
          position: absolute;
          z-index: 10;
          animation: rt-fade-in 0.15s;
        }
        @keyframes rt-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .rt-drag-hint-pill {
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(6px);
          color: white;
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          white-space: nowrap;
        }

        /* ══ MODALS ══ */
        .rt-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,0.45);
          backdrop-filter: blur(4px);
          padding: 16px;
        }
        .rt-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05);
          padding: 24px;
          width: 100%;
          max-width: 420px;
          animation: rt-modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (prefers-color-scheme: dark) {
          .rt-modal { background: #1e293b; }
        }
        @keyframes rt-modal-in {
          from { opacity: 0; transform: scale(0.93) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .rt-modal-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 3px;
        }
        .rt-modal-sub {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 14px;
          line-height: 1.5;
        }
        .rt-modal-input {
          width: 100%;
          padding: 9px 12px;
          border-radius: 9px;
          border: 1.5px solid #e2e8f0;
          font-size: 13px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
          margin-bottom: 8px;
        }
        .rt-modal-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
          background: white;
        }
        .rt-modal-input::placeholder { color: #94a3b8; }
        .rt-modal-textarea {
          width: 100%;
          padding: 9px 12px;
          border-radius: 9px;
          border: 1.5px solid #e2e8f0;
          font-size: 13px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .rt-modal-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: white; }
        .rt-modal-footer {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .rt-modal-btn-cancel {
          padding: 7px 16px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          background: white;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: background 0.12s;
        }
        .rt-modal-btn-cancel:hover { background: #f8fafc; }
        .rt-modal-btn-primary {
          padding: 7px 18px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: opacity 0.12s, transform 0.1s;
        }
        .rt-modal-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .rt-modal-btn-primary:active { transform: translateY(0); }
        .rt-modal-btn-primary.blue { background: #2563eb; }
        .rt-modal-btn-primary.red { background: #dc2626; }
        .rt-modal-btn-primary.green { background: #059669; }
        .rt-modal-img-preview {
          width: 100%;
          max-height: 140px;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 10px;
          background: #f8fafc;
        }
        .rt-modal-section-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #94a3b8;
          margin-bottom: 4px;
          display: block;
        }
        .rt-modal-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 8px;
        }
        .rt-modal-color-field {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          border-radius: 9px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
        }
        .rt-modal-color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 5px;
          border: 1px solid rgba(0,0,0,0.1);
          flex-shrink: 0;
        }
        .rt-modal-color-input {
          opacity: 0;
          position: absolute;
          width: 0;
          height: 0;
        }
        .rt-btn-preview-wrap {
          padding: 14px 16px;
          background: #f8fafc;
          border-radius: 9px;
          border: 1px dashed #e2e8f0;
          text-align: center;
          margin-bottom: 8px;
        }
        .rt-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 12px 0;
        }
      `}</style>

      {/* ── Gallery strip ── */}
      {Array.isArray(gallery) && gallery.length > 0 && (
        <div className="rt-gallery">
          <span className="rt-gallery-label">Media</span>
          {gallery.map((url, i) => (
            <button key={`g-${i}`} type="button" className="rt-gallery-thumb" onClick={() => insertImageUrl(url)} title="Insert into editor">
              {url && (
                <img src={url} alt={`gallery-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-image.png'; }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Quill editor ── */}
      <EditorComponent
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(v) => {
          if (!v) { if (value !== v) onChange?.(v); return; }
          const cleaned = v.replace(/&nbsp;|\u00a0/g, ' ');
          if (cleaned !== value) onChange?.(cleaned);
        }}
        onChangeSelection={onSelectionChange}
        placeholder={placeholder}
        style={{ minHeight: height }}
        modules={modules}
      />

      {/* ── Secondary toolbar ── */}
      <div className="rt-toolbar-bar">
        <div className="rt-toolbar-bar-left">
          <button type="button" className="rt-insert-btn yt" onClick={handleYouTubeInsert} title="Embed YouTube video">
            <YouTubeIcon /> YouTube
          </button>
          <button type="button" className="rt-insert-btn btn" onClick={handleButtonInsert} title="Insert CTA button">
            <ButtonIcon /> Button
          </button>
          <button type="button" className="rt-insert-btn acc" onClick={handleAccordionInsert} title="Insert accordion / FAQ">
            <AccordionIcon /> Accordion
          </button>
        </div>
        <button type="button" className={`rt-preview-btn${previewOpen ? ' active' : ''}`} onClick={() => setPreviewOpen(p => !p)}>
          <EyeIcon open={previewOpen} />
          {previewOpen ? 'Hide preview' : 'Preview'}
        </button>
      </div>

      {/* ── Hidden file input ── */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

      {/* ── Upload status ── */}
      {uploading && (
        <div className="rt-upload-bar">
          <div className="rt-upload-spinner" />
          Uploading image…
        </div>
      )}
      {uploadErr && (
        <div className="rt-error-bar">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          {uploadErr}
        </div>
      )}

      {/* ── Image controls panel ── */}
      {selectedImage && (
        <div className="rt-image-panel">
          <div className="rt-image-panel-header">
            <div className="rt-image-panel-dot" />
            <span className="rt-image-panel-title">Image Settings</span>
          </div>
          <div className="rt-image-panel-body">

            {/* Alt text */}
            <div>
              <div className="rt-panel-section-label">Alt Text (SEO &amp; Accessibility)</div>
              <input
                type="text"
                className="rt-alt-input"
                value={imageAltEdit}
                onChange={(e) => onAltChange(e.target.value)}
                placeholder="Describe the image…"
              />
            </div>

            {/* Width */}
            <div>
              <div className="rt-panel-section-label">Width</div>
              <div className="rt-width-row">
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={imageWidth}
                  className="rt-slider"
                  style={{ '--progress': `${imageWidth}%` }}
                  onChange={(e) => onWidthChange(Number(e.target.value))}
                />
                <div className="rt-width-badge">{imageWidth}%</div>
              </div>
              <div className="rt-width-presets">
                {[25, 33, 50, 66, 75, 100].map(p => (
                  <button key={p} type="button" className="rt-width-preset-btn" onClick={() => onWidthChange(p)}>{p}%</button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div>
              <div className="rt-panel-section-label">Layout / Alignment</div>
              <div className="rt-align-group">
                {alignOptions.map(({ mode, label, Icon: IcoCmp }) => (
                  <button
                    key={mode}
                    type="button"
                    className={`rt-align-btn${imageAlignment === mode ? ' active' : ''}`}
                    onClick={() => onAlignmentChange(mode)}
                    title={label}
                  >
                    <IcoCmp />
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Preview panel ── */}
      {previewOpen && (
        <div className="rt-preview-panel">
          <div className="rt-preview-label">Live Preview</div>
          <div className="rt-preview-body">
            {value
              ? <div className="font-body rich-text-container" dangerouslySetInnerHTML={{ __html: value }} />
              : <span style={{ color: '#94a3b8', fontSize: 13 }}>Start typing to see a preview…</span>
            }
          </div>
        </div>
      )}

      {/* ── Drag hint ── */}
      {dragHint && (
        <div className="rt-drag-hint" style={{ left: dragHint.left, top: Math.max(0, dragHint.top) }}>
          <div className="rt-drag-hint-pill">⠿ Drag to reposition</div>
        </div>
      )}

      {/* ══════ MODALS ══════ */}

      {/* Alt text modal */}
      {altModal && (
        <div className="rt-modal-backdrop" onClick={() => { altModal.resolve(''); setAltModal(null); }}>
          <div className="rt-modal" onClick={e => e.stopPropagation()}>
            <div className="rt-modal-title">Add Alt Text</div>
            <div className="rt-modal-sub">Describe the image for SEO and screen readers. You can skip this if not needed.</div>
            {altModal.file && (
              <img src={URL.createObjectURL(altModal.file)} alt="Preview" className="rt-modal-img-preview" />
            )}
            <input
              type="text"
              autoFocus
              id="alt-text-input"
              className="rt-modal-input"
              placeholder="e.g. Snow park entrance at SnowCity"
              onKeyDown={e => { if (e.key === 'Enter') { altModal.resolve(e.target.value); setAltModal(null); } }}
            />
            <div className="rt-modal-footer">
              <button type="button" className="rt-modal-btn-cancel" onClick={() => { altModal.resolve(''); setAltModal(null); }}>Skip</button>
              <button type="button" className="rt-modal-btn-primary blue" onClick={() => {
                const inp = document.getElementById('alt-text-input');
                altModal.resolve(inp?.value || '');
                setAltModal(null);
              }}>Save Alt Text</button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube modal */}
      {ytModal && (
        <div className="rt-modal-backdrop" onClick={() => setYtModal(false)}>
          <div className="rt-modal" onClick={e => e.stopPropagation()}>
            <div className="rt-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#dc2626' }}><YouTubeIcon /></span>
              Embed YouTube Video
            </div>
            <div className="rt-modal-sub">Paste a YouTube URL or video ID to embed a responsive player.</div>
            <input
              type="url"
              autoFocus
              className="rt-modal-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={ytUrl}
              onChange={e => setYtUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmYouTube()}
            />
            <div className="rt-modal-footer">
              <button type="button" className="rt-modal-btn-cancel" onClick={() => setYtModal(false)}>Cancel</button>
              <button type="button" className="rt-modal-btn-primary red" onClick={confirmYouTube}>Embed Video</button>
            </div>
          </div>
        </div>
      )}

      {/* Button modal */}
      {btnModal && (
        <div className="rt-modal-backdrop" onClick={() => setBtnModal(false)}>
          <div className="rt-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="rt-modal-title">Insert CTA Button</div>
            <div className="rt-modal-sub">Create a styled link button to insert into the content.</div>

            <input type="text" autoFocus className="rt-modal-input" placeholder="Button text (e.g. Book Now)" value={btnText} onChange={e => setBtnText(e.target.value)} />
            <input type="url" className="rt-modal-input" placeholder="Destination URL" value={btnLink} onChange={e => setBtnLink(e.target.value)} />

            <div className="rt-divider" />
            <div className="rt-modal-grid-2">
              <div>
                <span className="rt-modal-section-label">Padding</span>
                <input type="text" className="rt-modal-input" style={{ margin: 0 }} value={btnPadding} onChange={e => setBtnPadding(e.target.value)} />
              </div>
              <div>
                <span className="rt-modal-section-label">Border Radius</span>
                <input type="text" className="rt-modal-input" style={{ margin: 0 }} value={btnRadius} onChange={e => setBtnRadius(e.target.value)} />
              </div>
              <div>
                <span className="rt-modal-section-label">Background</span>
                <label className="rt-modal-color-field">
                  <div className="rt-modal-color-swatch" style={{ background: btnBg }} />
                  <span style={{ fontSize: 12, color: '#475569', flex: 1 }}>{btnBg}</span>
                  <input type="color" value={btnBg} onChange={e => setBtnBg(e.target.value)} style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} />
                  <input type="color" className="rt-modal-color-input" value={btnBg} onChange={e => setBtnBg(e.target.value)} />
                </label>
              </div>
              <div>
                <span className="rt-modal-section-label">Text Color</span>
                <label className="rt-modal-color-field">
                  <div className="rt-modal-color-swatch" style={{ background: btnColor }} />
                  <span style={{ fontSize: 12, color: '#475569', flex: 1 }}>{btnColor}</span>
                  <input type="color" className="rt-modal-color-input" value={btnColor} onChange={e => setBtnColor(e.target.value)} />
                </label>
              </div>
            </div>

            {btnText && (
              <div className="rt-btn-preview-wrap">
                <span style={{ display: 'inline-block', padding: btnPadding, background: btnBg, color: btnColor, borderRadius: btnRadius, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                  {btnText}
                </span>
              </div>
            )}

            <div className="rt-modal-footer">
              <button type="button" className="rt-modal-btn-cancel" onClick={() => setBtnModal(false)}>Cancel</button>
              <button type="button" className="rt-modal-btn-primary blue" onClick={confirmButton}>Insert Button</button>
            </div>
          </div>
        </div>
      )}

      {/* Accordion modal */}
      {accModal && (
        <div className="rt-modal-backdrop" onClick={() => setAccModal(false)}>
          <div className="rt-modal" onClick={e => e.stopPropagation()}>
            <div className="rt-modal-title">Insert Accordion</div>
            <div className="rt-modal-sub">Add a collapsible FAQ or expandable content block.</div>
            <span className="rt-modal-section-label">Title *</span>
            <input type="text" autoFocus className="rt-modal-input" placeholder="e.g. Terms & Conditions" value={accTitle} onChange={e => setAccTitle(e.target.value)} />
            <span className="rt-modal-section-label">Body Content</span>
            <textarea className="rt-modal-textarea" rows={4} placeholder="The details shown when expanded…" value={accContent} onChange={e => setAccContent(e.target.value)} />
            <div className="rt-modal-footer">
              <button type="button" className="rt-modal-btn-cancel" onClick={() => setAccModal(false)}>Cancel</button>
              <button type="button" className="rt-modal-btn-primary green" onClick={confirmAccordion}>Insert Accordion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}