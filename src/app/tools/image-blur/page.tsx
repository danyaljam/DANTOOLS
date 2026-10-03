import { ImageBlur } from "@/components/tools/image/ImageBlur";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Privacy Blur & Mask — DAN Tools",
  description: "Interactive canvas brush and rectangle mask to blur faces, cards, and sensitive details client-side.",
};

export default function Page() {
  return <ImageBlur />;
}

