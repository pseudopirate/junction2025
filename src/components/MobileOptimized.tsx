import { useEffect } from "react";

/**
 * Component to ensure proper mobile viewport settings and PWA optimization
 */
export function MobileOptimized({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none';

    // Set viewport meta tag programmatically
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );

    // Add theme-color meta tag for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', '#7c3aed');

    // Add apple-mobile-web-app-capable for iOS
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute('content', 'yes');

    // Add apple-mobile-web-app-status-bar-style
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleStatusBar);
    }
    appleStatusBar.setAttribute('content', 'black-translucent');
  }, []);

  return <>{children}</>;
}
