import Media from '@/components/Media';
import type { Silhouette } from '@/data';

type Props = {
  images?: string[];
  index?: number;
  alt: string;
  silhouette: Silhouette;
  tone: 'dark' | 'light';
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Product photography with an inline-SVG silhouette as the fallback.
 * Every image is rendered desaturated so the storefront stays strictly black and white.
 */
export default function Photo({
  images,
  index = 0,
  alt,
  silhouette,
  tone,
  className,
  priority,
  sizes,
}: Props) {
  const src = images?.[index] ?? images?.[0];
  if (!src) {
    return <Media silhouette={silhouette} tone={tone} className={className} label={alt} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className ? `photo ${className}` : 'photo'}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      sizes={sizes}
    />
  );
}
