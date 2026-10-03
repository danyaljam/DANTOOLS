import { PasswordGenerator } from "@/components/tools/developer/PasswordGenerator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Secure Password Generator — DAN Tools", description: "Generate strong passwords locally with the Web Crypto API." };
export default function Page() { return <PasswordGenerator />; }
