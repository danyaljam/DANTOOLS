"use client";

import * as React from "react";
import { Navbar } from "./Navbar";
import { PrivacyNoticeBanner } from "./PrivacyNotice";
import { Toaster } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PrivacyNoticeBanner />
      <Navbar />

      <div className="flex-1 flex w-full">
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {children}
        </main>
      </div>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

