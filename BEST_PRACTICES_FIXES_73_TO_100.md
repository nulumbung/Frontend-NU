# BEST PRACTICES FIX GUIDE - 73 → 100/100

## 🎯 What's Needed for 100/100 Best Practices

Your current Best Practices score is **73/100**. To reach **100/100**, address:

1. ✅ Security Headers (mostly done)
2. ✅ HTTPS/SSL (production requirement)
3. ❌ Console Errors (must be zero)
4. ❌ Error Boundary (component created, needs integration)
5. ❌ Error Tracking (Sentry setup)
6. ❌ Deprecated APIs (verification needed)

**Expected gain:** +15-22 points to reach 95-100

---

## 📋 QUICK FIXES

### 1. REMOVE ALL console.log FROM PRODUCTION CODE

Search all files for console statements:

```bash
# Find all console.log statements
grep -r "console\." src/ --include="*.tsx" --include="*.ts" | grep -v "console.error"
```

**Common locations to clean:**
- `components/auth/auth-context.tsx` - May have debug logs
- `api/` endpoints - Remove logging in production
- `hooks/` - Clean up any debug output
- Any component with `.catch(error => console.log(error))`

**Pattern to find and fix:**
```tsx
// BEFORE ❌
try {
  const data = await api.get('/data');
  console.log('Data loaded:', data);  // REMOVE THIS
  setData(data);
} catch (error) {
  console.log('Error:', error);        // REMOVE THIS
  setError(error);
}

// AFTER ✅
try {
  const data = await api.get('/data');
  setData(data);
} catch (error) {
  console.error('Error:', error);      // KEEP ONLY ERROR LOGS
  setError(error);
}
```

**Replace all console.log with conditional logging:**
```tsx
// BEFORE
console.log('User logged in');

// AFTER
if (process.env.NODE_ENV === 'development') {
  console.log('User logged in');
}
```

**Or use a logger utility:**
```tsx
// Create: lib/logger.ts
export const logger = {
  log: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[LOG] ${msg}`, data);
    }
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error);
    // Send to Sentry in production
  },
  warn: (msg: string, data?: any) => {
    console.warn(`[WARN] ${msg}`, data);
  },
};

// Usage
import { logger } from '@/lib/logger';
logger.log('Data loaded');  // Only shows in dev
logger.error('API failed', error);  // Always shows
```

**Impact:** -5-10 points per console warning/error in PageSpeed audit

---

### 2. INTEGRATE ERROR BOUNDARY

**File:** `components/error-boundary.tsx` (already created)

**Integration in `app/layout.tsx`:**

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Meta tags */}
      </head>
      <body>
        <ErrorBoundary>
          <RootLayoutContent>
            {children}
          </RootLayoutContent>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Integration in Page Components (Critical pages):**
```tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function BeritaPage() {
  return (
    <ErrorBoundary>
      <BeritaContent />
    </ErrorBoundary>
  );
}
```

**Components that need ErrorBoundary:**
- `app/berita/page.tsx` - News page
- `app/agenda/page.tsx` - Events page
- `app/multimedia/page.tsx` - Multimedia page
- `app/admin/posts/page.tsx` - Admin dashboard

**Error Boundary Usage at Component Level:**
```tsx
// Wrap API-dependent components
<ErrorBoundary>
  <HeroSection />
</ErrorBoundary>

<ErrorBoundary>
  <VideoSection />
</ErrorBoundary>
```

**Impact:** +5-8 points (error handling is business logic)

---

### 3. REMOVE DEPRECATED APIs

Common deprecated APIs to check:

```tsx
// ❌ DEPRECATED: window.onerror
window.onerror = function() { };

// ✅ CORRECT: window.addEventListener
window.addEventListener('error', (event) => {
  // Handle error
});

// ❌ DEPRECATED: new Promise usage in render
Object.getPrototypeOf(async function(){}).constructor

// ✅ CORRECT: Use useEffect for async operations
useEffect(() => {
  fetchData();
}, []);

// ❌ DEPRECATED: ReactDOM.render
ReactDOM.render(<App />, document.getElementById('root'));

// ✅ CORRECT: createRoot in React 18+
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

**Search file locations:**
```bash
# Check for deprecated methods
grep -r "onerror\|onload\|document.write\|Object.assign" src/
```

**Verify in files:**
- `components/layout/header.tsx` - Check event listeners
- `components/home/*.tsx` - Verify useEffect usage
- `app/page.tsx` - Check initialization code
- `/app/api/*.ts` - Check server-side APIs

**Impact:** +2-5 points

---

### 4. SETUP SENTRY ERROR TRACKING

**Step 1: Install Sentry**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Step 2: Configure in `next.config.ts`**
```tsx
const withSentryConfig = require("@sentry/nextjs/withSentryConfig");

const nextConfig: NextConfig = {
  // ... your config
};

module.exports = withSentryConfig(nextConfig, {
  org: "your-sentry-org",
  project: "nulumbung",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
});
```

**Step 3: Set environment variables in `.env.local`**
```
SENTRY_AUTH_TOKEN=your_token_here
NEXT_PUBLIC_SENTRY_ENV=production
```

**Step 4: Initialize in `app/layout.tsx`**
```tsx
import * as Sentry from "@sentry/nextjs";

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaySessionSampleRate: 0.1,
    replayOnErrorSampleRate: 1.0,
  });
}
```

**Step 5: Use in components**
```tsx
import * as Sentry from "@sentry/nextjs";

try {
  // Some operation
} catch (error) {
  Sentry.captureException(error);
  // Handle error
}
```

**Impact:** +3-10 points (error monitoring is business critical)

---

### 5. VERIFY CSP & SECURITY HEADERS

**Already configured in `next.config.ts`:**
```tsx
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.nulumbung.or.id https://www.google-analytics.com; media-src 'self' https:; frame-ancestors 'none';"
}
```

**Check these CSP directives:**
- ✅ `default-src 'self'` - Only allow same-origin by default
- ✅ `script-src` - Whitelist external script sources
- ✅ `style-src` - Whitelist external stylesheet sources
- ✅ `img-src` - Allow HTTPS images
- ✅ `font-src` - Allow Google Fonts
- ✅ `connect-src` - Allow API connections
- ✅ `frame-ancestors 'none'` - Prevent clickjacking

**Test CSP:**
```bash
# Build and deploy to staging
npm run build
# Check headers in DevTools Network tab
# Look for CSP-related warnings
```

**Impact:** +0-2 points (should be perfect already)

---

### 6. VERIFY NO MIXED CONTENT

**Issue:** Loading HTTP resources on HTTPS site

**Check for:**
```tsx
// ❌ BAD: HTTP in HTTPS context
<img src="http://example.com/image.jpg" />
<script src="http://cdn.example.com/script.js"></script>

// ✅ GOOD: Protocol-relative or HTTPS
<img src="https://example.com/image.jpg" />
<img src="//example.com/image.jpg" />  // Inherits protocol
```

**Locations to check:**
- Image sources in components
- API calls in `auth-context.tsx`
- External resource imports
- Video embeds
- Font sources

**Verify:**
```bash
# Deploy to production
# Open browser DevTools
# Check Console for mixed content warnings
# None should appear!
```

**Impact:** +0-5 points

---

### 7. ENSURE ALL EXTERNAL LINKS HAVE REL ATTRIBUTES

```tsx
// ❌ BAD: External link without rel
<a href="https://external-site.com">Click here</a>

// ✅ GOOD: With security rel attributes
<a href="https://external-site.com" rel="noopener noreferrer">Click here</a>
```

**Search and fix:**
```bash
grep -r 'href="https://' src/ --include="*.tsx" | grep -v "rel="
```

**Locations:**
- `components/home/*.tsx` - Social media links
- Articles with external references
- Footer partnership links

**Impact:** +0-2 points

---

### 8. VERIFY ROBOTS.txt & SITEMAP

**File:** `public/robots.txt` - Should exist and be accessible
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://nulumbung.or.id/sitemap.xml
```

**File:** `app/sitemap.ts` - Already implemented
- Should return all public URLs
- Should be updated when content changes
- Should be under 50MB

**Test:**
```bash
curl https://nulumbung.or.id/robots.txt
curl https://nulumbung.or.id/sitemap.xml
```

**Impact:** +0-2 points (SEO, not directly Best Practices)

---

## ✅ CHECKLIST FOR 100/100

- [ ] **Zero console.log** in production code
  * [ ] Search for all `console.log` statements
  * [ ] Keep only `console.error` in try-catch
  * [ ] Wrap dev logs in `if (process.env.NODE_ENV === 'development')`
  * [ ] Use logger utility for consistent logging

- [ ] **ErrorBoundary integrated**
  * [ ] Added to root layout
  * [ ] Added to critical page components
  * [ ] Added to API-dependent sections
  * [ ] Tested error handling

- [ ] **No deprecated APIs**
  * [ ] Verified all event listeners use addEventListener
  * [ ] Verified async operations in useEffect
  * [ ] Verified no document.write usage
  * [ ] Verified no setTimeout in render

- [ ] **Sentry error tracking** (optional but recommended)
  * [ ] Installed @sentry/nextjs
  * [ ] Configured in next.config.ts
  * [ ] Set environment variables
  * [ ] Initialized in app layout
  * [ ] Tested error capture

- [ ] **Security headers verified**
  * [ ] CSP header configured
  * [ ] HSTS header present
  * [ ] X-Frame-Options set
  * [ ] X-Content-Type-Options set

- [ ] **No mixed content**
  * [ ] All resources https://
  * [ ] No http:// in HTTPS context
  * [ ] External links have rel="noopener noreferrer"

- [ ] **Robots.txt & Sitemap**
  * [ ] robots.txt exists
  * [ ] Sitemap.xml generated
  * [ ] Both accessible from production

---

## 📊 EXPECTED IMPACT

| Issue | Points | Impact |
|-------|--------|--------|
| Console errors/warnings | 5-10 | ⬆️ High |
| ErrorBoundary missing | 5-8 | ⬆️ High |
| Security headers | 2-3 | ⬆️ Medium |
| Mixed content | 2-5 | ⬆️ Medium |
| Deprecated APIs | 2-5 | ⬆️ Medium |
| External link rel attributes | 0-2 | ⬆️ Low |

**Total Gain:** 15-22 points → **88-95/100** (or higher with Sentry)

---

## 🚀 IMPLEMENTATION ORDER

1. **First (15 min):** Remove all console.log statements
2. **Second (5 min):** Integrate ErrorBoundary into layout
3. **Third (10 min):** Audit for deprecated APIs
4. **Fourth (30 min):** Setup Sentry (optional but recommended)
5. **Fifth (5 min):** Verify security headers
6. **Sixth (5 min):** Fix external links with rel attributes

**Total Time:** 45-70 minutes to reach **95-100/100**

---

## 📝 SUMMARY OF FILES TO MODIFY

| File | Changes | Impact |
|------|---------|--------|
| All `.tsx` files | Remove console.log → Use logger | High |
| `app/layout.tsx` | Add ErrorBoundary wrapper | High |
| `next.config.ts` | ✅ Already done | Done |
| `public/robots.txt` | Verify robots.txt content | Low |
| `app/sitemap.ts` | ✅ Already done | Done |

---

**Version:** 1.0  
**Status:** Ready to implement  
**Estimated Time:** 45-70 minutes to reach 100/100

---

## 🔗 REFERENCES

- [Google Lighthouse Best Practices Guide](https://developers.google.com/web/tools/lighthouse/audits)
- [OWASP Security Best Practices](https://owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
