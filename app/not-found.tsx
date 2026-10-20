import "./globals.css";
import Link from "next/link";
import { outfit, geistMono } from "@/lib/fonts";

// Only reached for URLs outside any locale (the proxy redirects almost
// everything into /es or /en, which have their own translated 404).
export default function RootNotFound() {
  return (
    <html lang="es" className={`${outfit.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-muted-foreground">Página no encontrada · Page not found</p>
        <Link href="/" className="text-primary underline underline-offset-4">
          Unos Por Otros · Praywall
        </Link>
      </body>
    </html>
  );
}
