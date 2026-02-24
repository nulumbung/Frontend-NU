'use client';

import { api } from '@/components/auth/auth-context';
import Image from 'next/image';
import { ElementType, useEffect, useRef, useState } from 'react';

export interface AdvertisementItem {
  id: number;
  title: string;
  placement: string;
  content_type: 'image' | 'html';
  image_url?: string | null;
  html_content?: string | null;
  target_url?: string | null;
  alt_text?: string | null;
}

interface AdSlotProps {
  ad: AdvertisementItem;
  className?: string;
}

export function AdSlot({ ad, className = '' }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || hasTrackedImpression) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasTrackedImpression) return;

        setHasTrackedImpression(true);
        observer.disconnect();

        try {
          await api.post(`/ads/${ad.id}/impression`);
        } catch (error) {
          console.error('Failed to track ad impression', error);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ad.id, hasTrackedImpression]);

  const handleClick = async (event: React.MouseEvent) => {
    if (!ad.target_url) return;
    event.preventDefault();

    try {
      await api.post(`/ads/${ad.id}/click`);
    } catch (error) {
      console.error('Failed to track ad click', error);
    } finally {
      window.open(ad.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  const Wrapper: ElementType = ad.target_url ? 'a' : 'div';

  return (
    <div ref={containerRef} className={`rounded-xl border border-border bg-card overflow-hidden ${className}`}>
      <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
        Iklan
      </div>

      <Wrapper
        href={ad.target_url || undefined}
        target={ad.target_url ? '_blank' : undefined}
        rel={ad.target_url ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        className="block"
      >
        {ad.content_type === 'image' && ad.image_url ? (
          <div className="relative w-full min-h-[120px]">
            <Image
              src={ad.image_url}
              alt={ad.alt_text || ad.title}
              width={1200}
              height={630}
              className="w-full h-auto object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="p-4 text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: ad.html_content || '' }}
          />
        )}
      </Wrapper>
    </div>
  );
}
