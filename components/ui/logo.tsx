'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showSubLabel?: boolean;
}

export function Logo({ className, showSubLabel = true }: LogoProps) {
  return (
    <Link href="/" className={cn("group relative flex flex-col items-start", className)}>
      <div className="relative flex items-center h-10 overflow-hidden">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
          
          .nl-wordmark {
            display: flex;
            align-items: center;
            font-family: 'Playfair Display', serif;
          }

          .nl-nu {
            font-size: 24px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.5px;
            color: transparent;
            background: linear-gradient(160deg, #b8f0be 0%, #66bb6a 22%, #43a047 45%, #2e7d32 68%, #1a4d1c 100%);
            -webkit-background-clip: text;
            background-clip: text;
            background-size: 200% 200%;
            text-shadow: 1px 1px 0 #1b4b1d;
            position: relative;
            animation: nl-entry-left 0.8s cubic-bezier(0.16,1,0.3,1) forwards, nl-nu-glow 6s ease-in-out infinite 1s, nl-shimmer-bg 5s ease-in-out infinite 1.5s;
          }

          .nl-nu::after {
            content: 'NU';
            position: absolute; inset: 0;
            font-size: inherit; font-weight: inherit; letter-spacing: inherit; line-height: inherit;
            background: linear-gradient(108deg, transparent 25%, rgba(255,255,255,0.6) 47%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 53%, transparent 75%);
            background-size: 300% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: nl-sweep 4.5s ease-in-out infinite 2s;
            pointer-events: none;
          }

          .nl-divider {
            width: 2px;
            height: 20px;
            background: #b8b8b0;
            margin: 0 6px;
            opacity: 1;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
          }

          .nl-lumbung {
            font-size: 24px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.5px;
            color: transparent;
            background: linear-gradient(160deg, #f8f8f4 0%, #c0bfba 18%, #6a6a65 40%, #1e1e1b 65%, #080807 100%);
            -webkit-background-clip: text;
            background-clip: text;
            text-shadow: 1px 1px 0 #3a3a36;
            position: relative;
            opacity: 0;
            animation: nl-entry-right 0.8s cubic-bezier(0.16,1,0.3,1) forwards 0.2s;
          }

          @media (min-width: 768px) {
            .nl-nu, .nl-lumbung { font-size: 32px; letter-spacing: -1px; }
            .nl-divider { height: 26px; margin: 0 8px; }
          }

          .nl-lumbung::after {
            content: 'LUMBUNG';
            position: absolute; inset: 0;
            font-size: inherit; font-weight: inherit; letter-spacing: inherit; line-height: inherit;
            background: linear-gradient(108deg, transparent 25%, rgba(255,255,255,0.4) 47%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 53%, transparent 75%);
            background-size: 300% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: nl-sweep 4.5s ease-in-out infinite 3s;
            pointer-events: none;
          }

          @keyframes nl-entry-left {
            from { opacity: 0; transform: translateX(-20px); }
            to   { opacity: 1; transform: translateX(0); }
          }

          @keyframes nl-entry-right {
            from { opacity: 0; transform: translateX(20px); }
            to   { opacity: 1; transform: translateX(0); }
          }

          @keyframes nl-fade-in {
            from { opacity: 0; height: 0; }
            to   { opacity: 0.6; height: 24px; }
          }

          @keyframes nl-nu-glow {
            0%,100% { filter: drop-shadow(0 0 2px rgba(76,175,80,0.25)); }
            50%     { filter: drop-shadow(0 0 5px rgba(76,175,80,0.5)) brightness(1.06); }
          }

          @keyframes nl-sweep {
            0%        { background-position: 150% 0; }
            55%, 100% { background-position: -150% 0; }
          }

          @keyframes nl-shimmer-bg {
            0%,100% { background-position: 0% 50%; }
            50%     { background-position: 100% 50%; }
          }
        `}</style>
        
        <div className="nl-wordmark">
          <span className="nl-nu">NU</span>
          <div className="nl-divider" />
          <span className="nl-lumbung">LUMBUNG</span>
        </div>
      </div>
      
      {/* Sub Label */}
      {showSubLabel && (
        <span className="font-sans text-[10px] md:text-xs text-gray-500 tracking-widest uppercase mt-1 group-hover:text-accent-teal transition-colors duration-300">
          Portal Berita Nahdlatul Ulama
        </span>
      )}
    </Link>
  );
}
