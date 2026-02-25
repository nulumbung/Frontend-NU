
'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/components/auth/auth-context';
import { CommentSection } from '@/components/comments/comment-section';
import { AdSlot, AdvertisementItem } from '@/components/ads/ad-slot';
import { ShareButtons } from '@/components/share-buttons';

interface PostDetail {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string | null;
  image_caption?: string | null;
  image_credit?: string | null;
  tags: string[];
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  author?: {
    name?: string | null;
    avatar?: string | null;
  } | null;
  created_at: string;
  read_time?: string | null;
  views?: number;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

const isArrayResponse = <T,>(value: unknown): value is T[] => Array.isArray(value);
const INLINE_IMAGE_META_REGEX =
  /<p[^>]*>\s*(<img\b[^>]*>)\s*<\/p>\s*(?:<p[^>]*>\s*<em[^>]*>\s*Keterangan Gambar:\s*([^<]*?)\s*<\/em>\s*<\/p>\s*)?(?:<p[^>]*>\s*<em[^>]*>\s*Kredit Gambar:\s*([^<]*?)\s*<\/em>\s*<\/p>\s*)?/gi;
const CAPTION_PREFIX = 'keterangan gambar:';
const CREDIT_PREFIX = 'kredit gambar:';

const formatInlineImageMetaByRegex = (html: string) =>
  html.replace(INLINE_IMAGE_META_REGEX, (match, imgTag, captionRaw, creditRaw) => {
    const caption = String(captionRaw || '').trim();
    const credit = String(creditRaw || '').trim();

    if (!caption && !credit) return match;

    const metaLine = caption && credit ? `${caption} | Foto: ${credit}` : caption || `Foto: ${credit}`;
    return `<figure class="article-inline-image">${imgTag}<figcaption>${metaLine}</figcaption></figure>`;
  });

const getMetaFromElement = (element: Element): { type: 'caption' | 'credit'; value: string } | null => {
  const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const lowered = text.toLowerCase();
  if (lowered.startsWith(CAPTION_PREFIX)) {
    return {
      type: 'caption',
      value: text.slice(CAPTION_PREFIX.length).trim(),
    };
  }
  if (lowered.startsWith(CREDIT_PREFIX)) {
    return {
      type: 'credit',
      value: text.slice(CREDIT_PREFIX.length).trim(),
    };
  }

  return null;
};

const getNextMeaningfulElementSibling = (element: Element | null): Element | null => {
  let current = element?.nextElementSibling || null;
  while (current) {
    const text = (current.textContent || '').replace(/\u00A0/g, ' ').trim();
    const hasMedia = Boolean(current.querySelector('img,video,iframe'));
    if (current.tagName === 'P' && !hasMedia && !text) {
      current = current.nextElementSibling;
      continue;
    }
    return current;
  }
  return null;
};

const formatInlineImageMetaWithDom = (html: string) => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = Array.from(doc.body.querySelectorAll('img'));

  images.forEach((img) => {
    const container = img.closest('figure') || (img.parentElement?.tagName === 'P' ? img.parentElement : img);
    if (!container || !container.parentElement) return;

    let caption = '';
    let credit = '';
    const nodesToRemove: Element[] = [];
    let cursor = getNextMeaningfulElementSibling(container);

    while (cursor && nodesToRemove.length < 2) {
      const meta = getMetaFromElement(cursor);
      if (!meta) break;

      nodesToRemove.push(cursor);
      if (meta.type === 'caption' && !caption) caption = meta.value;
      if (meta.type === 'credit' && !credit) credit = meta.value;
      cursor = getNextMeaningfulElementSibling(cursor);
    }

    if (!caption && !credit) return;

    let figure: HTMLElement;
    if (container.tagName === 'FIGURE') {
      figure = container as HTMLElement;
    } else {
      figure = doc.createElement('figure');
      figure.className = 'article-inline-image';
      if (container.tagName === 'P') {
        container.parentElement.insertBefore(figure, container);
        figure.appendChild(img);
        container.remove();
      } else {
        // If the image is a standalone node, move it into figure without removing the moved node.
        img.parentElement?.insertBefore(figure, img);
        figure.appendChild(img);
      }
    }

    figure.classList.add('article-inline-image');
    const existingFigcaption = figure.querySelector('figcaption');
    if (existingFigcaption) {
      existingFigcaption.remove();
    }

    const figcaption = doc.createElement('figcaption');
    figcaption.textContent = caption && credit ? `${caption} | Foto: ${credit}` : caption || `Foto: ${credit}`;
    figure.appendChild(figcaption);

    nodesToRemove.forEach((node) => node.remove());
  });

  return doc.body.innerHTML;
};

const formatInlineImageMeta = (html: string) => {
  if (!html) return html;
  const domFormatted = formatInlineImageMetaWithDom(html);
  return domFormatted !== html ? domFormatted : formatInlineImageMetaByRegex(html);
};

export default function BeritaDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [news, setNews] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<PostDetail[]>([]);
  const [popularNews, setPopularNews] = useState<PostDetail[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [adsByPlacement, setAdsByPlacement] = useState<Record<string, AdvertisementItem[]>>({
    post_detail_top: [],
    post_detail_inline: [],
    post_detail_sidebar: [],
    post_detail_bottom: [],
  });

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get(`/posts/${slug}`);
        const currentPost = response.data as PostDetail;
        setNews(currentPost);

        const [
          latestResult,
          postListResult,
          categoryResult,
          topAdResult,
          inlineAdResult,
          sidebarAdResult,
          bottomAdResult,
        ] = await Promise.allSettled([
          api.get('/posts/latest'),
          api.get('/posts'),
          api.get('/categories'),
          api.get('/ads/active', { params: { placement: 'post_detail_top', limit: 1 } }),
          api.get('/ads/active', { params: { placement: 'post_detail_inline', limit: 1 } }),
          api.get('/ads/active', { params: { placement: 'post_detail_sidebar', limit: 2 } }),
          api.get('/ads/active', { params: { placement: 'post_detail_bottom', limit: 1 } }),
        ]);

        if (latestResult.status === 'fulfilled') {
          const latestRows: PostDetail[] = isArrayResponse<PostDetail>(latestResult.value.data)
            ? latestResult.value.data
            : [];
          setRelatedNews(
            latestRows
              .filter((item) => item.id !== currentPost.id && item.slug !== currentPost.slug)
              .slice(0, 3)
          );
        }

        if (postListResult.status === 'fulfilled') {
          const listRows: PostDetail[] = isArrayResponse<PostDetail>(postListResult.value.data?.data)
            ? postListResult.value.data.data
            : [];
          const sorted = [...listRows].sort((a, b) => Number(b.views || 0) - Number(a.views || 0));
          setPopularNews(
            sorted
              .filter((item) => item.id !== currentPost.id && item.slug !== currentPost.slug)
              .slice(0, 5)
          );
        }

        if (categoryResult.status === 'fulfilled') {
          setCategories(isArrayResponse<CategoryItem>(categoryResult.value.data) ? categoryResult.value.data : []);
        }

        setAdsByPlacement({
          post_detail_top:
            topAdResult.status === 'fulfilled' && isArrayResponse<AdvertisementItem>(topAdResult.value.data)
              ? topAdResult.value.data
              : [],
          post_detail_inline:
            inlineAdResult.status === 'fulfilled' && isArrayResponse<AdvertisementItem>(inlineAdResult.value.data)
              ? inlineAdResult.value.data
              : [],
          post_detail_sidebar:
            sidebarAdResult.status === 'fulfilled' && isArrayResponse<AdvertisementItem>(sidebarAdResult.value.data)
              ? sidebarAdResult.value.data
              : [],
          post_detail_bottom:
            bottomAdResult.status === 'fulfilled' && isArrayResponse<AdvertisementItem>(bottomAdResult.value.data)
              ? bottomAdResult.value.data
              : [],
        });
      } catch (error) {
        console.error('Failed to fetch news detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [slug]);

  const authorName = news?.author?.name?.trim() || 'Penulis';
  const formattedContent = useMemo(() => formatInlineImageMeta(news?.content || ''), [news?.content]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!news) {
    return <div className="min-h-screen flex items-center justify-center">Berita tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-accent">Beranda</Link>
        <span>/</span>
        <Link href="/berita" className="hover:text-accent">Berita</Link>
        <span>/</span>
        <span className="text-accent font-bold truncate max-w-[200px]">{news.title}</span>
      </div>

      <div className="container mx-auto px-4">
        {adsByPlacement.post_detail_top[0] && (
          <div className="mb-8">
            <AdSlot ad={adsByPlacement.post_detail_top[0]} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Content (8 cols) */}
          <article className="lg:col-span-8">

            {/* Hero Article */}
            <div className="mb-8">
              <div className="mb-6">
                {news.category && (
                  <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] md:text-xs font-bold tracking-wider mb-3 md:mb-4 border border-accent-foreground/20 shadow-lg shadow-accent/20">
                    {news.category.name}
                  </span>
                )}
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4 md:mb-6 max-w-4xl">
                  {news.title}
                </h1>

                {/* Metadata Bar */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-accent">
                      {news.author?.avatar ? (
                        <Image
                          src={news.author.avatar}
                          alt={authorName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/60 text-foreground text-xs font-bold">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-foreground">{authorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                    <span>{new Date(news.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  {news.read_time && (
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                      <span>{news.read_time} baca</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Eye className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                    <span>{Number(news.views || 0).toLocaleString()} views</span>
                  </div>
                </div>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group bg-secondary/30">
                {news.image ? (
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary/50" />
                )}
              </div>
            </div>

            {/* Image Caption & Credit */}
            {(news.image_caption || news.image_credit) && (
              <div className="text-xs text-muted-foreground italic text-center mt-2 mb-8">
                {news.image_caption && <span>{news.image_caption}</span>}
                {news.image_caption && news.image_credit && <span> | </span>}
                {news.image_credit && <span>Foto: {news.image_credit}</span>}
              </div>
            )}

            {/* Share Buttons */}
            <ShareButtons title={news.title} variant="inline" />

            {adsByPlacement.post_detail_inline[0] && (
              <div className="mb-8">
                <AdSlot ad={adsByPlacement.post_detail_inline[0]} />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none font-serif text-foreground leading-relaxed [&_img]:w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-6 [&_figure.article-inline-image]:my-8 [&_figure.article-inline-image]:mx-0 [&_figure.article-inline-image>img]:my-0 [&_figure.article-inline-image>img]:rounded-xl [&_figure.article-inline-image>figcaption]:mt-2 [&_figure.article-inline-image>figcaption]:text-center [&_figure.article-inline-image>figcaption]:text-xs [&_figure.article-inline-image>figcaption]:italic [&_figure.article-inline-image>figcaption]:text-muted-foreground">
              {news.excerpt && (
                <p className="font-bold text-lg text-foreground mb-6">
                  {news.excerpt}
                </p>
              )}

              <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-bold text-muted-foreground mr-2 py-1">Tags:</span>
                  {news.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${tag.toLowerCase()}`}
                      className="px-4 py-1 rounded-full bg-card border border-border text-sm hover:border-accent hover:text-accent transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Box */}
            <div className="mt-12 p-8 rounded-2xl bg-card border border-border flex items-center gap-6">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-accent flex-shrink-0">
                {news.author?.avatar ? (
                  <Image
                    src={news.author.avatar}
                    alt={authorName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/40 text-foreground text-2xl font-bold">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground mb-1">{authorName}</h3>
                <p className="text-sm text-muted-foreground">Profil penulis belum tersedia.</p>
              </div>
            </div>

            {adsByPlacement.post_detail_bottom[0] && (
              <div className="mt-12">
                <AdSlot ad={adsByPlacement.post_detail_bottom[0]} />
              </div>
            )}

            {/* Related Articles */}
            <div className="mt-16">
              <h3 className="font-serif text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-1 h-8 bg-accent rounded-full" />
                Baca Juga
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <Link key={item.id} href={`/berita/${item.slug}`} className="group block">
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-secondary/30">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary/50" />
                      )}
                    </div>
                    <h4 className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-accent transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </Link>
                ))}
                {relatedNews.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada artikel terkait saat ini.</p>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-16 pt-12 border-t border-border">
              <CommentSection
                contentType="post"
                target={news.slug || news.id}
                title="Komentar Artikel"
                placeholder="Tulis pendapat Anda tentang artikel ini..."
                emptyMessage="Belum ada komentar untuk artikel ini."
              />
            </div>

          </article>

          {/* Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Sidebar content similar to news list page */}
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-accent rounded-full" />
                Berita Terpopuler
              </h3>
              <div className="space-y-4">
                {popularNews.map((item) => (
                  <Link key={item.id} href={`/berita/${item.slug}`} className="flex gap-4 group items-start">
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary/20">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary/50" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                        {item.title}
                      </h4>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </Link>
                ))}
                {popularNews.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada berita populer.</p>
                )}
              </div>

              {adsByPlacement.post_detail_sidebar.map((ad) => (
                <div key={ad.id} className="mt-6">
                  <AdSlot ad={ad} />
                </div>
              ))}

              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-accent rounded-full" />
                  Kategori
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/kategori/${cat.slug}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                        {cat.name}
                      </span>
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground group-hover:text-accent">
                        Lihat
                      </span>
                    </Link>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">Belum ada data kategori.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
