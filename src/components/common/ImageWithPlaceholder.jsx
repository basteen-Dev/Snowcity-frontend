import React from 'react';

const DEFAULT_PLACEHOLDER = '/logo.png';

export default function ImageWithPlaceholder({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  placeholderSrc = DEFAULT_PLACEHOLDER,
  placeholderClassName = 'bg-white',
  onLoad,
  onError,
  ...imgProps
}) {
  const resolvedSrc = typeof src === 'string' ? src : '';
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [resolvedSrc]);

  const showImage = Boolean(resolvedSrc) && !failed;
  const showPlaceholder = Boolean(placeholderSrc) && (!showImage || !loaded);

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      {showPlaceholder && (
        <div
          className={`absolute inset-0 bg-center bg-no-repeat bg-contain ${placeholderClassName}`.trim()}
          style={{ backgroundImage: `url("${placeholderSrc}")` }}
          aria-hidden="true"
        />
      )}
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`.trim()}
          onLoad={(event) => {
            setLoaded(true);
            if (onLoad) onLoad(event);
          }}
          onError={(event) => {
            setFailed(true);
            setLoaded(true);
            if (onError) onError(event);
          }}
          {...imgProps}
        />
      ) : null}
    </div>
  );
}
