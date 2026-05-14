import type { ReactNode } from 'react';

// Root layout — delegates html/body to [locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
