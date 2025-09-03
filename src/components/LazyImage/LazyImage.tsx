import React, { useState, useRef, useEffect, memo } from 'react';

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage component for optimized image loading
 * Features intersection observer, fallback handling, and accessibility
 */
const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  className = '',
  placeholder,
  fallback,
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const shouldLoadImage = loading === 'eager' || isInView;
  const imageSrc = hasError && fallback ? fallback : src;

  return (
    <div
      ref={imgRef}
      className={className}
      style={{
        width,
        height,
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!isLoaded && !hasError && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              style={{ width: '50%', height: '50%', opacity: 0.5 }}
            />
          ) : (
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
          )}
        </div>
      )}
      
      {hasError && !fallback ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}
        >
          ❌
        </div>
      ) : (
        shouldLoadImage && (
          <img
            src={imageSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
            loading={loading}
          />
        )
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;