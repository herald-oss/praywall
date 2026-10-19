import { notFound } from "next/navigation";

// Any unknown path under /es or /en renders the translated not-found page.
export default function CatchAllPage() {
  notFound();
}
