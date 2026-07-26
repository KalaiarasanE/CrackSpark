import { useState, useEffect, memo, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/hero_background.jpg",
  priority = false,
  className,
  containerClassName,
  style,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
    setIsError(false);

    // Preload priority images immediately
    if (priority && src && typeof window !== "undefined") {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
      img.onerror = () => {
        setIsError(true);
        if (fallbackSrc) setImgSrc(fallbackSrc);
      };
    }
  }, [src, priority, fallbackSrc]);

  return (
    <div className={cn("relative overflow-hidden bg-muted/40", containerClassName)}>
      {/* Skeleton Shimmer Loader */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-muted/60 via-muted to-muted/60" />
      )}

      <img
        src={imgSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsError(true);
          if (fallbackSrc && imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
        }}
        className={cn(
          "transition-opacity duration-300 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
        style={style}
        {...props}
      />
    </div>
  );
});
