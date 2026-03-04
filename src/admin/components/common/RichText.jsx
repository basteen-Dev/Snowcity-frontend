import React from 'react';
import uploadAdminMedia from '../../utils/uploadMedia';
import { absoluteUrl } from '../../../utils/media';

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

  // ── Modal states ──
  const [altModal, setAltModal] = React.useState(null); // { file: File, resolve }
  const [ytModal, setYtModal] = React.useState(false);
  const [imageAltEdit, setImageAltEdit] = React.useState('');
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

  // ── Insertion Handlers (Move to top) ──
  const handleYouTubeInsert = React.useCallback(() => {
    setYtUrl('');
    setYtModal(true);
  }, []);

  const handleButtonInsert = React.useCallback(() => {
    setBtnText('');
    setBtnLink('');
    setBtnModal(true);
  }, []);

  const handleAccordionInsert = React.useCallback(() => {
    setAccTitle('');
    setAccContent('');
    setAccModal(true);
  }, []);

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
            // Use inline styles instead of classes for alignment and size for better portability
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
            if (Font) {
              Font.whitelist = FONT_WHITELIST;
              QuillCtor.register(Font, true);
            }
            fontSetupRef.current = true;
          }
          ref.current.Editor = EditorComponent;
          force();
          setEditorReady(true);
          return;
        }
      } catch (e) {
        console.warn('RichText: editor not available. Using textarea fallback.', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Paste handler: strip backgrounds using Quill matchers ──
  React.useEffect(() => {
    if (!editorReady) return;
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;

    // Use Quill's matcher API to sanitize content on paste.
    // This avoids the "double paste" issue caused by manual event listeners.
    quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      delta.ops.forEach((op) => {
        if (op.attributes) {
          // 1. Strip all background colors
          if (op.attributes.background) delete op.attributes.background;

          // 2. Strip white/near-white text colors (common in dark-mode copy-paste)
          if (op.attributes.color) {
            const color = op.attributes.color.toLowerCase().replace(/\s/g, '');
            if (['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(color)) {
              delete op.attributes.color;
            }
          }
        }
      });
      return delta;
    });
  }, [editorReady]);

  // ── Image upload with alt text prompt ──
  const handleSelectImage = React.useCallback(() => {
    setUploadErr('');
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      setUploadErr('');
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      for (const file of files) {
        // Show alt-text modal
        const altText = await new Promise((resolve) => {
          setAltModal({ file, resolve });
        });

        const url = await uploadAdminMedia(file, { folder: 'editor' });
        const range = quill.getSelection(true);
        const insertAt = range ? range.index : quill.getLength();
        const imageUrl = resolveAssetUrl(url);
        quill.insertEmbed(insertAt, 'image', imageUrl, 'user');
        // Set alt attribute on the inserted image
        const imgNode = quill.root.querySelector(`img[src="${imageUrl}"]`);
        if (imgNode && altText) {
          imgNode.setAttribute('alt', altText);
        }
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

    // Extract YouTube video ID
    let videoId = '';
    try {
      const url = new URL(ytUrl.trim());
      if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v') || '';
      }
    } catch {
      // Try direct ID
      videoId = ytUrl.trim();
    }

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
    // Using a structured div for styling parity
    const accordionHtml = `
      <details class="cms-accordion" style="border:1px solid #e5e7eb; border-radius:12px; margin:1rem 0; overflow:hidden;">
        <summary style="padding:1rem; background:#f9fafb; font-weight:600; cursor:pointer; list-style:none;">${accTitle.trim()}</summary>
        <div class="cms-accordion-content" style="padding:1rem; border-top:1px solid #e5e7eb;">${accContent.trim() || 'Content goes here...'}</div>
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
      const imageUrl = resolveAssetUrl(url);
      quill.insertEmbed(insertAt, 'image', imageUrl, 'user');
      quill.setSelection(insertAt + 1);
    } catch (err) {
      console.error('Insert image failed', err);
    }
  }, []);

  const applyWidth = React.useCallback(
    (node, pct) => {
      if (!node) return;
      const clamped = Math.min(100, Math.max(20, pct));
      node.style.width = `${clamped}%`;
      node.style.maxWidth = '100%';
      node.dataset.widthPct = String(clamped);
    },
    []
  );

  const applyAlignment = React.useCallback((node, mode) => {
    if (!node) return;
    const align = mode || 'inline';
    node.dataset.alignMode = align;
    node.style.float = '';
    node.style.display = '';
    node.style.margin = '';
    node.style.marginLeft = '';
    node.style.marginRight = '';
    node.style.marginTop = '';
    node.style.marginBottom = '';

    if (align === 'left') {
      node.style.float = 'left';
      node.style.margin = '0 1rem 1rem 0';
      node.style.display = 'block';
    } else if (align === 'right') {
      node.style.float = 'right';
      node.style.margin = '0 0 1rem 1rem';
      node.style.display = 'block';
    } else if (align === 'center') {
      node.style.display = 'block';
      node.style.marginLeft = 'auto';
      node.style.marginRight = 'auto';
      node.style.marginBottom = '1rem';
    } else {
      node.style.display = 'inline-block';
      node.style.marginBottom = '1rem';
    }
  }, []);

  const onSelectionChange = React.useCallback(
    (range) => {
      if (!range) {
        setSelectedImage(null);
        setImageWidth(100);
        setImageAlignment('inline');
        return;
      }
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      const [leaf] = quill.getLeaf(range.index);
      if (leaf && leaf.domNode && leaf.domNode.tagName === 'IMG') {
        setSelectedImage(leaf.domNode);
        const pct = Number(leaf.domNode.dataset.widthPct || 100);
        setImageWidth(Number.isFinite(pct) ? pct : 100);
        setImageAlignment(leaf.domNode.dataset.alignMode || 'inline');
        setImageAltEdit(leaf.domNode.getAttribute('alt') || '');
      } else {
        setSelectedImage(null);
        setImageAlignment('inline');
      }
    },
    []
  );

  const onWidthChange = (pct) => {
    setImageWidth(pct);
    applyWidth(selectedImage, pct);
  };

  const onAlignmentChange = (mode) => {
    setImageAlignment(mode);
    applyAlignment(selectedImage, mode);
  };

  const onAltChange = (alt) => {
    setImageAltEdit(alt);
    if (selectedImage) selectedImage.setAttribute('alt', alt);
  };

  React.useEffect(() => {
    if (!selectedImage) return;
    applyWidth(selectedImage, imageWidth);
    applyAlignment(selectedImage, imageAlignment);
  }, [selectedImage, imageWidth, imageAlignment, applyWidth, applyAlignment]);

  // ── Drag and drop for images ──
  React.useEffect(() => {
    if (!editorReady) return undefined;
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return undefined;
    const root = quill.root;
    const getRangeFromPoint = (event) => {
      if (document.caretRangeFromPoint) return document.caretRangeFromPoint(event.clientX, event.clientY);
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
          const range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
          return range;
        }
      }
      return null;
    };

    const handleDragStart = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.tagName !== 'IMG') return;
      const quillInstance = quillRef.current?.getEditor?.();
      if (!quillInstance) return;
      const QuillConstructor = quillInstance.constructor;
      const blot = QuillConstructor.find(event.target, true);
      if (!blot) return;
      const index = quillInstance.getIndex(blot);
      dragStateRef.current = { index, src: event.target.getAttribute('src') };
      event.dataTransfer?.setData('text/plain', 'drag-image');
      event.dataTransfer?.setDragImage(event.target, event.target.width / 2, event.target.height / 2);
    };

    const handleDragOver = (event) => {
      if (!dragStateRef.current.src) return;
      event.preventDefault();
    };

    const handleDrop = (event) => {
      const { index: fromIndex, src } = dragStateRef.current;
      if (fromIndex == null || !src) return;
      event.preventDefault();
      const quillInstance = quillRef.current?.getEditor?.();
      if (!quillInstance) return;
      const range = getRangeFromPoint(event);
      let insertIndex = quillInstance.getLength();
      if (range) {
        const QuillConstructor = quillInstance.constructor;
        const blot = QuillConstructor.find(range.startContainer, true);
        if (blot) insertIndex = quillInstance.getIndex(blot);
      }
      let targetIndex = insertIndex;
      if (targetIndex > fromIndex) targetIndex -= 1;
      quillInstance.deleteText(fromIndex, 1, 'user');
      quillInstance.insertEmbed(targetIndex, 'image', src, 'user');
      quillInstance.setSelection(targetIndex + 1, 0, 'user');
      dragStateRef.current = { index: null, src: null };
    };

    const handleMouseOver = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.tagName !== 'IMG') return;
      event.target.setAttribute('draggable', 'true');
      const imageRect = event.target.getBoundingClientRect();
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      if (!wrapperRect) return;
      setDragHint({
        left: imageRect.left - wrapperRect.left + wrapperRef.current.scrollLeft,
        top: imageRect.top - wrapperRect.top + wrapperRef.current.scrollTop - 30,
        width: imageRect.width,
      });
    };

    const handleMouseOut = (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.tagName !== 'IMG') return;
      setDragHint(null);
    };

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

  const modules = React.useMemo(
    () => ({
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
        handlers: {
          image: handleSelectImage,
          video: handleYouTubeInsert,
        }
      },
      clipboard: {
        matchVisual: false,
      }
    }),
    [handleSelectImage, handleYouTubeInsert]
  );

  const EditorComponent = ref.current.Editor;

  if (!EditorComponent) {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: height }}
        className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
      />
    );
  }

  return (
    <div ref={wrapperRef} className="richtext space-y-2 relative">
      <style>{`
        .ql-editor { 
          min-height: ${height}px; 
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.8;
          color: #1f2937;
        }
        /* Match frontend paragraph spacing exactly to prevent "too much space" surprises */
        .ql-editor p { margin-bottom: 1.5rem !important; }
        .ql-editor h1, .ql-editor h2, .ql-editor h3 {
          font-family: 'Red Hat Display', sans-serif;
          font-weight: 800;
          color: #111827;
          margin-top: 2.5rem !important;
          margin-bottom: 1.25rem !important;
        }
        .ql-editor h1 { font-size: 2.5rem; }
        .ql-editor h2 { font-size: 2.0rem; }
        .ql-editor h3 { font-size: 1.5rem; }
        .ql-editor ul, .ql-editor ol { margin-bottom: 1.5rem; }
        .ql-tooltip { z-index: 10000 !important; }
      `}</style>
      {Array.isArray(gallery) && gallery.length ? (
        <div className="rounded-md border p-2 flex gap-2 overflow-x-auto mb-2 bg-white dark:bg-neutral-800">
          {gallery.map((url, i) => (
            <button
              key={`g-${i}`}
              type="button"
              onClick={() => insertImageUrl(url)}
              className="w-20 h-12 shrink-0 rounded-md overflow-hidden border hover:ring-2 hover:ring-blue-500"
              title="Insert image into editor"
            >
              {url && (
                <img
                  src={url}
                  alt={`img-${i}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Visual Editor</span>
          {/* Extra toolbar buttons */}
          <button
            type="button"
            onClick={handleYouTubeInsert}
            className="px-2 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium"
            title="Insert YouTube video"
          >
            ▶ YouTube
          </button>
          <button
            type="button"
            onClick={handleButtonInsert}
            className="px-2 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium"
            title="Insert styled button with link"
          >
            ⬡ Button
          </button>
          <button
            type="button"
            onClick={handleAccordionInsert}
            className="px-2 py-1 rounded-md border border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs font-medium"
            title="Insert Accordion / FAQ"
          >
            ± Accordion
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen((prev) => !prev)}
          className="px-2 py-1 rounded-md border"
        >
          {previewOpen ? 'Hide preview' : 'Show preview'}
        </button>
      </div>
      <EditorComponent
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(v) => {
          if (!v) {
            if (value !== v) onChange?.(v);
            return;
          }
          // Replace &nbsp; and Unicode non-breaking spaces (\u00a0) with regular spaces
          const cleaned = v.replace(/&nbsp;|\u00a0/g, ' ');
          // Only trigger parent onChange if the cleaned value actually changed relative to the provided prop.
          // This prevents infinite loops when Quill insists on adding &nbsp; back.
          if (cleaned !== value) {
            onChange?.(cleaned);
          }
        }}
        onChangeSelection={onSelectionChange}
        placeholder={placeholder}
        style={{ minHeight: height }}
        modules={modules}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      {uploading ? <div className="text-xs text-gray-500">Uploading image…</div> : null}
      {uploadErr ? <div className="text-xs text-red-600">{uploadErr}</div> : null}

      {/* ── Image controls panel (when image selected) ── */}
      {selectedImage ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-900/10 p-3 text-sm">
          <div className="font-medium text-gray-900 dark:text-neutral-100">Image Controls</div>
          {/* Alt text */}
          <div>
            <label className="text-xs text-gray-600 dark:text-neutral-400 block mb-1">Alt Text (SEO)</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-sm dark:bg-neutral-800 dark:text-neutral-200"
              value={imageAltEdit}
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="Describe the image for accessibility & SEO…"
            />
          </div>
          {/* Width */}
          <div>
            <label className="text-xs text-gray-600 dark:text-neutral-400">Width: {imageWidth}%</label>
            <input
              type="range"
              min={20}
              max={100}
              value={imageWidth}
              onChange={(e) => onWidthChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex flex-wrap gap-2 text-xs mt-1">
              <button type="button" className="px-2 py-1 rounded-md border" onClick={() => onWidthChange(100)}>
                Reset width
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded-md border"
                onClick={() => onWidthChange(50)}
              >
                50%
              </button>
            </div>
          </div>
          {/* Alignment */}
          <div>
            <div className="text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Alignment</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {['inline', 'left', 'center', 'right'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`px-2 py-1 rounded-md border ${imageAlignment === mode ? 'bg-gray-900 text-white' : ''}`}
                  onClick={() => onAlignmentChange(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Preview ── */}
      {previewOpen ? (
        <div className="richtext-preview text-sm mt-2">
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <div className="text-gray-400 text-xs">Start typing to see a live preview…</div>
          )}
        </div>
      ) : null}

      {/* ── Drag hint ── */}
      {dragHint ? (
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: dragHint.left, top: Math.max(0, dragHint.top) }}
        >
          <div className="rounded-xl bg-gray-900/80 text-white text-xs px-3 py-1 shadow">
            Drag image to reposition
          </div>
        </div>
      ) : null}

      {/* ══════ MODALS ══════ */}

      {/* Alt text modal for new image upload */}
      {altModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { altModal.resolve(''); setAltModal(null); }}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">Image Alt Text</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mb-3">
              Describe this image for SEO and accessibility. You can leave empty if needed.
            </p>
            {altModal.file && (
              <div className="mb-3 rounded-lg overflow-hidden border max-h-40">
                <img src={URL.createObjectURL(altModal.file)} alt="Preview" className="w-full h-full object-contain max-h-40" />
              </div>
            )}
            <input
              type="text"
              autoFocus
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 text-sm mb-3"
              placeholder="e.g. Snow park entrance at SnowCity"
              id="alt-text-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  altModal.resolve(e.target.value);
                  setAltModal(null);
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border text-sm text-gray-700 dark:text-neutral-300"
                onClick={() => { altModal.resolve(''); setAltModal(null); }}
              >
                Skip
              </button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium"
                onClick={() => {
                  const inp = document.getElementById('alt-text-input');
                  altModal.resolve(inp?.value || '');
                  setAltModal(null);
                }}
              >
                Save Alt Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube URL modal */}
      {ytModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setYtModal(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">Embed YouTube Video</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mb-3">
              Paste a YouTube URL (e.g. https://www.youtube.com/watch?v=xxx)
            </p>
            <input
              type="url"
              autoFocus
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 text-sm mb-3"
              placeholder="https://www.youtube.com/watch?v=..."
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmYouTube()}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-3 py-1.5 rounded-xl border text-sm" onClick={() => setYtModal(false)}>Cancel</button>
              <button type="button" className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-sm font-medium" onClick={confirmYouTube}>Embed Video</button>
            </div>
          </div>
        </div>
      )}

      {/* Button modal */}
      {btnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setBtnModal(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3 mb-3">
              <input
                type="text"
                autoFocus
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                placeholder="Button text (e.g. Book Now)"
                value={btnText}
                onChange={(e) => setBtnText(e.target.value)}
              />
              <input
                type="url"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                placeholder="Link URL"
                value={btnLink}
                onChange={(e) => setBtnLink(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Padding</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 rounded-lg border text-xs dark:bg-neutral-700"
                    value={btnPadding}
                    onChange={(e) => setBtnPadding(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Margin</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 rounded-lg border text-xs dark:bg-neutral-700"
                    value={btnMargin}
                    onChange={(e) => setBtnMargin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Background</label>
                  <input
                    type="color"
                    className="w-full h-8 p-0 border-0 bg-transparent cursor-pointer"
                    value={btnBg}
                    onChange={(e) => setBtnBg(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Text Color</label>
                  <input
                    type="color"
                    className="w-full h-8 p-0 border-0 bg-transparent cursor-pointer"
                    value={btnColor}
                    onChange={(e) => setBtnColor(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Border Radius</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 rounded-lg border text-xs dark:bg-neutral-700"
                    value={btnRadius}
                    onChange={(e) => setBtnRadius(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            {btnText && (
              <div className="mb-3 text-center p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl">
                <span style={{
                  display: 'inline-block',
                  padding: btnPadding,
                  margin: btnMargin,
                  backgroundColor: btnBg,
                  color: btnColor,
                  borderRadius: btnRadius,
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  {btnText}
                </span>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-3 py-1.5 rounded-xl border text-sm" onClick={() => setBtnModal(false)}>Cancel</button>
              <button type="button" className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium" onClick={confirmButton}>Insert Button</button>
            </div>
          </div>
        </div>
      )}

      {/* Accordion modal */}
      {accModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAccModal(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">Insert Accordion</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">Add a collapsible content section.</p>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Accordion Title *</label>
                <input
                  type="text"
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                  placeholder="e.g. Terms & Conditions"
                  value={accTitle}
                  onChange={(e) => setAccTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Content (Keep it brief)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                  rows={4}
                  placeholder="The details that will be hidden until clicked..."
                  value={accContent}
                  onChange={(e) => setAccContent(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-3 py-1.5 rounded-xl border text-sm" onClick={() => setAccModal(false)}>Cancel</button>
              <button type="button" className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium" onClick={confirmAccordion}>Insert Accordion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}