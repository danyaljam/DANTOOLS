import { SocialResizer } from "@/components/tools/image/SocialResizer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Media Resizer & Cropper — DAN Tools",
  description: "Crop and resize images to standard YouTube, Instagram, Twitter, and LinkedIn aspect ratios locally.",
};

export default function Page() {
  return <SocialResizer />;
}

