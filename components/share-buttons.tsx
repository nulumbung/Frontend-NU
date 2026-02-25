'use client';

import { useState } from 'react';
import { Facebook, Instagram, Share2, Link as LinkIcon, Check } from 'lucide-react';

interface ShareButtonsProps {
    title: string;
    /** Optional text for share message, defaults to title */
    text?: string;
    /** Display variant: 'inline' for horizontal bar, 'card' for sidebar card, 'compact' for small row */
    variant?: 'inline' | 'card' | 'compact';
}

export function ShareButtons({ title, text, variant = 'inline' }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const getUrl = () => (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = text || title;

    const copyToClipboard = async () => {
        const url = getUrl();
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
        }
        setTimeout(() => setCopied(false), 2500);
    };

    const handleFacebook = () => {
        const url = getUrl();
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank',
            'noopener,noreferrer,width=640,height=720'
        );
    };

    const handleInstagram = async () => {
        // Instagram doesn't have a direct share URL — copy link and open Instagram
        await copyToClipboard();
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    };

    const handleNativeShare = async () => {
        const url = getUrl();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: shareText,
                    url: url,
                });
            } catch {
                // User cancelled or share failed — ignore
            }
        } else {
            // Fallback: copy link if Web Share API not supported
            await copyToClipboard();
        }
    };

    // ── Card variant (sidebar style) ──
    if (variant === 'card') {
        return (
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="font-serif text-xl font-bold mb-4">Bagikan</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleFacebook} className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5" /> Facebook
                    </button>
                    <button onClick={handleInstagram} className="py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-pink-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5" /> Instagram
                    </button>
                    <button onClick={handleNativeShare} className="py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" /> Bagikan
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className={`py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${copied ? 'bg-green-100 text-green-700' : 'bg-secondary/50 hover:bg-secondary text-muted-foreground'
                            }`}
                    >
                        {copied ? <><Check className="w-3.5 h-3.5" /> Disalin!</> : <><LinkIcon className="w-3.5 h-3.5" /> Salin Link</>}
                    </button>
                </div>
            </div>
        );
    }

    // ── Compact variant (single row, for multimedia etc.) ──
    if (variant === 'compact') {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handleFacebook} className="p-2 rounded-full bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-colors" title="Facebook">
                    <Facebook className="w-4 h-4" />
                </button>
                <button onClick={handleInstagram} className="p-2 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-pink-500 hover:from-purple-500 hover:to-pink-500 hover:text-white transition-colors" title="Instagram">
                    <Instagram className="w-4 h-4" />
                </button>
                <button onClick={handleNativeShare} className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors" title="Bagikan">
                    <Share2 className="w-4 h-4" />
                </button>
                <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-full transition-colors ${copied ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500 hover:text-white'
                        }`}
                    title={copied ? 'Disalin!' : 'Salin Link'}
                >
                    {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </button>
                {copied && <span className="text-xs text-green-600 font-medium">Disalin!</span>}
            </div>
        );
    }

    // ── Inline variant (default, horizontal bar) ──
    return (
        <div className="flex items-center justify-between border-y border-border py-4">
            <span className="font-bold text-muted-foreground text-sm uppercase tracking-widest">Bagikan:</span>
            <div className="flex gap-3">
                <button onClick={handleFacebook} className="p-2 rounded-full bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-colors" title="Facebook">
                    <Facebook className="w-5 h-5" />
                </button>
                <button onClick={handleInstagram} className="p-2 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-pink-500 hover:from-purple-500 hover:to-pink-500 hover:text-white transition-colors" title="Instagram">
                    <Instagram className="w-5 h-5" />
                </button>
                <button onClick={handleNativeShare} className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors" title="Bagikan ke semua platform">
                    <Share2 className="w-5 h-5" />
                </button>
                <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-full transition-colors ${copied ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500 hover:text-white'
                        }`}
                    title={copied ? 'Disalin!' : 'Salin Link'}
                >
                    {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
