import './globals.css';

import localFont from 'next/font/local';

import { SidebarProvider } from '@/context/SidebarContext';

/**
 * The panel's one and only typeface.
 *
 * Tinos is drawn as a metric-compatible substitute for Times New Roman, which is
 * what this panel *asked* for and never shipped: the old declaration was
 * `font-family: 'Times New Roman', Times, serif` with no font bytes anywhere, so
 * every device rendered it in whatever serif it happened to own. macOS and
 * Windows have Times; Android substitutes a wider Noto serif and every text box
 * grows, and most Linux has neither. That meant every layout measured on a Mac
 * was measured against a font a large share of real devices do not have — the
 * failure mode is a header or a button overflowing at narrow widths, on hardware
 * you never tested.
 *
 * SELF-HOSTED, and it must stay that way. `next/font/google` downloads the
 * binaries from fonts.gstatic.com *during `next build`*, which makes Google
 * Fonts a hard dependency of every production deploy — and a `--no-cache` build
 * re-fetches every time. That has taken a deploy down before now: Google served
 * the build container CSS pointing at files it had already purged, and
 * `next build` failed on an unchanged commit. Verify with a network-blocked
 * build (`https_proxy=http://127.0.0.1:1 npm run build`); it must still succeed.
 *
 * ONLY 400 AND 700 — deliberately. Times New Roman has no 500 and no 600, so
 * this panel's 193 `font-medium` elements resolve down to 400 and its 20
 * `font-semibold` resolve up to 700. Declaring the four styles Tinos actually
 * has reproduces that exactly. Adding a real 500 face would silently make 193
 * elements heavier on every screen.
 *
 * `scripts/build-fonts.py` regenerates these files and then *proves* the metric
 * claim, comparing advance widths glyph-by-glyph against the machine's own Times
 * New Roman. Run it (never as part of `npm run build`) before taking an upstream
 * Tinos release or changing the subset, and do not commit output it reports as
 * FAIL.
 */
const tinos = localFont({
  src: [
    { path: '../fonts/tinos-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/tinos-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/tinos-700.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/tinos-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-tinos',
  // Metric-identical first fallback, so on any device that already has Times
  // (macOS, Windows) the swap is invisible — no reflow at all while the woff2
  // loads.
  fallback: ['Times New Roman', 'Times', 'serif'],
  // Size-adjust the generic fallback against Times' metrics rather than Next's
  // Arial default, which is a sans and would mis-size a serif. This is what
  // keeps the one-time first-paint reflow small on Android, which has no Times.
  adjustFontFallback: 'Times New Roman',
});

export const metadata: Metadata = {
  title: "Base Dashboard",
  description: "Base Dashboard admin panel",
};

import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { I18nProvider } from '@/context/I18nContext';
import { ImageViewerProvider } from '@/context/ImageViewerContext';
import ToastContainer from '@/components/ui/toast/ToastContainer';
import { Metadata } from 'next';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `lang` is not only an accessibility attribute — it participates in the
  // browser's font-fallback choice for any glyph the primary face lacks. This
  // panel defaults to English (see I18nContext); a deployment that runs it
  // primarily in another language should change this to match, or the fallback
  // picked for a missing glyph is chosen against the wrong language.
  //
  // No `style` on <body>: the font used to be set by an inline style here, which
  // outranked the stylesheet and made `globals.css` a misleading place to look
  // for it. It now comes from `--font-tinos` → `--font-serif` → `font-serif`:
  // one path, declared once.
  return (
    <html lang="en" className={tinos.variable}>
      <body className="dark:bg-gray-900" suppressHydrationWarning>
        <I18nProvider>
          <ThemeProvider>
            <SidebarProvider>
              <ToastProvider>
                <ImageViewerProvider>
                  {children}
                  <ToastContainer />
                </ImageViewerProvider>
              </ToastProvider>
            </SidebarProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
