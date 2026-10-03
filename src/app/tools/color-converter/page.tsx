import { ColorConverter } from "@/components/tools/developer/ColorConverter";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Color Converter — DAN Tools", description: "Convert HEX colors to RGB, HSL, and CSS values locally." };
export default function Page() { return <ColorConverter />; }
