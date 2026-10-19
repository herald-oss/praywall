// The real root layout (with <html lang>) is app/[locale]/layout.tsx so the
// document language matches the page. This pass-through exists because the
// root not-found page needs a layout above it.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
