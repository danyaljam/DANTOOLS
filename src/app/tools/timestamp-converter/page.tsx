import { TimestampConverter } from "@/components/tools/developer/TimestampConverter";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unix Timestamp Converter — DAN Tools", description: "Convert Unix timestamps and dates locally in your browser." };
export default function Page() { return <TimestampConverter />; }
