'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ChevronDown, Hash } from 'lucide-react';
import * as MdIcons from 'react-icons/md';
import type { IconType } from 'react-icons';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { api } from '@/components/auth/auth-context';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
}

interface BanomItem {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  short_desc?: string | null;
}

interface SearchItem {
  title: string;
  type: 'Berita' | 'Agenda' | 'Kategori' | 'Banom' | 'Multimedia';
  href: string;
  category?: string;
  date?: string;
}

interface PostSearchRow {
  id: number;
  slug?: string | null;
  title: string;
  created_at?: string | null;
  category?: {
    name?: string | null;
  } | null;
}

interface AgendaSearchRow {
  id: number;
  slug?: string | null;
  title: string;
  date_start?: string | null;
}

interface CategorySearchRow {
  id: number;
  slug: string;
  name: string;
  image?: string | null;
  icon?: string | null;
}

interface BanomSearchRow {
  id: number;
  slug: string;
  name: string;
  logo?: string | null;
  short_desc?: string | null;
}

interface MultimediaSearchRow {
  id: number;
  slug?: string | null;
  title: string;
  date?: string | null;
}

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const REFRESH_INTERVAL = 30000;
const categoryIconMap = MdIcons as Record<string, IconType>;
const isLegacyIconName = (value?: string | null) => Boolean(value && /^Md[A-Z0-9]/.test(value));

const navItems = [
  { label: 'Beranda', href: '/' },
  { label: 'Berita', href: '/berita' },
  { label: 'Agenda', href: '/agenda' },
  { label: 'Banom', href: '/banom', hasDropdown: true },
  { label: 'Kategori', href: '/kategori', hasDropdown: true },
  { label: 'Multimedia', href: '/multimedia' },
  { label: 'Sejarah', href: '/sejarah' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [banoms, setBanoms] = useState<BanomItem[]>([]);

  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const [postRes, agendaRes, categoryRes, banomRes, multimediaRes] = await Promise.allSettled([
          api.get('/posts/latest'),
          api.get('/agendas'),
          api.get('/categories'),
          api.get('/banoms'),
          api.get('/multimedia'),
        ]);

        const postRows = postRes.status === 'fulfilled' ? toArray<PostSearchRow>(postRes.value.data) : [];
        const agendaRows = agendaRes.status === 'fulfilled' ? toArray<AgendaSearchRow>(agendaRes.value.data) : [];
        const categoryRows = categoryRes.status === 'fulfilled' ? toArray<CategorySearchRow>(categoryRes.value.data) : [];
        const banomRows = banomRes.status === 'fulfilled' ? toArray<BanomSearchRow>(banomRes.value.data) : [];
        const multimediaRows =
          multimediaRes.status === 'fulfilled' ? toArray<MultimediaSearchRow>(multimediaRes.value.data) : [];

        setCategories(categoryRows.slice(0, 8));
        setBanoms(banomRows.slice(0, 10));

        const nextIndex: SearchItem[] = [
          ...postRows.map((item) => ({
            title: item.title,
            type: 'Berita' as const,
            href: `/berita/${item.slug || item.id}`,
            category: item.category?.name || undefined,
            date: item.created_at || undefined,
          })),
          ...agendaRows.map((item) => ({
            title: item.title,
            type: 'Agenda' as const,
            href: `/agenda/${item.slug || item.id}`,
            date: item.date_start || undefined,
          })),
          ...categoryRows.map((item) => ({
            title: item.name,
            type: 'Kategori' as const,
            href: `/kategori/${item.slug}`,
          })),
          ...banomRows.map((item) => ({
            title: item.name,
            type: 'Banom' as const,
            href: `/banom/${item.slug}`,
          })),
          ...multimediaRows.map((item) => ({
            title: item.title,
            type: 'Multimedia' as const,
            href: `/multimedia/${item.slug || item.id}`,
            date: item.date || undefined,
          })),
        ];

        setSearchIndex(nextIndex);
      } catch (error) {
        console.error('Failed to fetch header data:', error);
        setCategories([]);
        setBanoms([]);
        setSearchIndex([]);
      }
    };

    fetchHeaderData();
    const intervalId = window.setInterval(fetchHeaderData, REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, []);

  const searchResults = useMemo(() => {
    if (searchQuery.length <= 2) return [];
    const keyword = searchQuery.toLowerCase();
    return searchIndex
      .filter(
        (item) => {
          const title = (item.title || '').toLowerCase();
          const category = (item.category || '').toLowerCase();
          return title.includes(keyword) || category.includes(keyword);
        }
      )
      .slice(0, 5);
  }, [searchIndex, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 h-[60px] md:h-[72px]",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex-shrink-0 z-50">
            <Logo />
          </div>

          {/* Center: Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.label)}
                onMouseLeave={() => item.hasDropdown && setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 font-sans font-medium text-sm tracking-wider transition-colors py-6",
                    pathname === item.href
                      ? "text-accent text-glow-gold"
                      : "text-foreground/70 hover:text-accent"
                  )}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />}
                </Link>

                {/* Animated Underline */}
                {pathname === item.href && (
                  <div
                    className="absolute bottom-4 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-teal to-accent transition-opacity"
                  />
                )}

                {/* Mega Dropdown */}
                {item.hasDropdown && activeDropdown === item.label && (
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 transition-all duration-300 opacity-100 visible"
                  >
                    <div className="bg-card/95 backdrop-blur-xl border border-accent/20 rounded-xl shadow-2xl neon-box overflow-hidden">
                      {item.label === 'Banom' ? (
                        <div className="grid grid-cols-2 gap-4 p-6 w-[520px]">
                          {banoms.map((banom) => (
                            <Link
                              key={banom.id}
                              href={`/banom/${banom.slug}`}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                            >
                              <div className="relative w-10 h-10 flex-shrink-0 rounded-full border border-border/60 bg-background/70 p-1 overflow-hidden">
                                {banom.logo ? (
                                  <Image
                                    src={banom.logo}
                                    alt={banom.name}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                    {banom.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-foreground group-hover/item:text-accent transition-colors">
                                  {banom.name}
                                </div>
                                {banom.short_desc && (
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {banom.short_desc}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                          {banoms.length === 0 && (
                            <div className="col-span-2 text-sm text-muted-foreground p-3">
                              Data banom belum tersedia.
                            </div>
                          )}
                        </div>
                      ) : item.label === 'Kategori' ? (
                        <div className="grid grid-cols-4 gap-3 p-6 w-[640px]">
                          {categories.map((cat) => {
                            const iconName = cat.icon || (isLegacyIconName(cat.image) ? cat.image : '');
                            const IconComponent = iconName ? categoryIconMap[iconName] : undefined;

                            return (
                              <Link
                                key={cat.id}
                                href={`/kategori/${cat.slug}`}
                                className="flex flex-col items-center p-3 rounded-lg hover:bg-white/5 transition-all group/cat text-center"
                              >
                                <div className="w-10 h-10 rounded-xl mb-2 bg-background/70 border border-border/60 flex items-center justify-center">
                                  {IconComponent ? (
                                    <IconComponent className="w-5 h-5 text-accent" />
                                  ) : (
                                    <Hash className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <span className="font-bold text-sm text-foreground group-hover/cat:text-accent transition-colors">
                                  {cat.name}
                                </span>
                                <span className="text-xs text-muted-foreground">Buka Kategori</span>
                              </Link>
                            );
                          })}
                          {categories.length === 0 && (
                            <div className="col-span-4 text-sm text-muted-foreground p-3">
                              Data kategori belum tersedia.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-foreground/70 hover:text-accent transition-colors hover:bg-white/5 rounded-full"
              aria-label="Cari berita atau agenda"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            <Link
              href="/live"
              className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/50 bg-red-500/10 text-red-400 text-xs font-bold tracking-wider hover:bg-red-500/20 transition-all group"
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              LIVE
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-foreground hover:text-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            >
              <Menu className={cn("w-6 h-6 transition-transform", isMobileMenuOpen ? "text-accent" : "")} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[998] bg-black/40 lg:hidden transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Tutup sidebar"
          />

          <div
            className={cn(
              "fixed top-0 right-0 bottom-0 z-[999] w-[50vw] bg-background/80 backdrop-blur-md lg:hidden pt-[80px] px-6 border-l border-white/10 shadow-2xl transition-transform duration-300",
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex flex-col gap-4 overflow-y-auto h-full pb-20">
              {navItems.map((item, idx) => (
                <div key={idx} className="border-b border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base font-serif font-bold text-foreground hover:text-accent transition-colors"
                    >
                      {item.label}
                    </Link>
                    {item.hasDropdown && (
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className="p-1"
                      >
                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform duration-300",
                            mobileExpanded === item.label ? "rotate-180 text-accent" : ""
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Mobile Dropdown Content */}
                  {item.hasDropdown && mobileExpanded === item.label && (
                    <div
                      className="overflow-hidden transition-all duration-300 max-h-96"
                    >
                      <div className="pt-2 pl-3 flex flex-col gap-2 border-l border-white/10 ml-1">
                        {item.label === 'Banom' && (
                          banoms.map((banom) => (
                            <Link
                              key={banom.id}
                              href={`/banom/${banom.slug}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="text-muted-foreground hover:text-accent text-xs font-medium py-1"
                            >
                              {banom.name}
                            </Link>
                          ))
                        )}
                        {item.label === 'Kategori' && (
                          categories.map((cat) => {
                            const iconName = cat.icon || (isLegacyIconName(cat.image) ? cat.image : '');
                            const IconComponent = iconName ? categoryIconMap[iconName] : undefined;

                            return (
                              <Link
                                key={cat.id}
                                href={`/kategori/${cat.slug}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-muted-foreground hover:text-accent text-xs font-medium py-1 flex items-center gap-2"
                              >
                                <span className="w-5 h-5 rounded bg-background/70 border border-border/60 flex items-center justify-center">
                                  {IconComponent ? (
                                    <IconComponent className="w-3 h-3" />
                                  ) : (
                                    <Hash className="w-3 h-3" />
                                  )}
                                </span>
                                {cat.name}
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-8">
                <Link
                  href="/live"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-bold"
                >
                  LIVE STREAMING
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-start pt-24 md:pt-32 px-4 transition-opacity duration-300 opacity-100 visible"
        >
          <div
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          />

          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden relative z-10 transition-all duration-300 scale-100 opacity-100"
          >
            <div className="relative border-b border-border">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berita, agenda, atau informasi lainnya..."
                className="w-full bg-transparent px-16 py-6 text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors bg-secondary rounded-full"
                aria-label="Tutup pencarian"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 bg-secondary/20">
              {searchResults.length > 0 ? (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Hasil Pencarian</h3>
                  <div className="flex flex-col gap-2">
                    {searchResults.map((result, idx) => (
                      <Link
                        key={idx}
                        href={result.href}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-background hover:shadow-sm transition-all group"
                      >
                        <div className="flex flex-col">
                          <span className="font-serif font-bold text-foreground group-hover:text-accent transition-colors">{result.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{result.type}</span>
                            {result.category && <span className="text-xs text-muted-foreground">• {result.category}</span>}
                            {result.date && <span className="text-xs text-muted-foreground">• {result.date}</span>}
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 -rotate-90 text-muted-foreground group-hover:text-accent transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Pencarian Populer</h3>
                  {categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {categories.slice(0, 7).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSearchQuery(item.name)}
                          className="px-4 py-2 rounded-lg bg-background hover:bg-accent hover:text-accent-foreground border border-border hover:border-accent transition-all text-sm font-medium shadow-sm"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada data kategori untuk pencarian populer.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
