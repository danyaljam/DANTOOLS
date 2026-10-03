import { JwtBase64Decoder } from "@/components/tools/developer/JwtBase64Decoder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base64 & JWT Decoder — DAN Tools",
  description: "Inspect JWT claims, check token expiration, and convert Base64 text and files safely client-side.",
};

export default function Page() {
  return <JwtBase64Decoder />;
}

