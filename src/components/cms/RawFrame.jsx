// src/components/cms/RawFrame.jsx
import React from 'react';
import clsx from 'clsx';

export default function RawFrame({ title = 'page', html = '', css = '', js = '', className = '', style }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!js || !containerRef.current) return;
    const script = document.createElement('script');
    script.text = js;
    containerRef.current.appendChild(script);
    return () => {
      if (containerRef.current && containerRef.current.contains(script)) {
        containerRef.current.removeChild(script);
      }
    };
  }, [js]);

  return (
    <div className={clsx('w-full', className)} style={style}>
      {css && <style>{css}</style>}
      <div 
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: html || '' }} 
      />
    </div>
  );
}