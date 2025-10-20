import type React from "react";

import { Sidebar } from "@/components/molecules";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="relative flex h-screen bg-slate-900 overflow-hidden">
      <Sidebar />
      <main className="flex-grow overflow-hidden ml-16 flex flex-col dark-scrollbar">
        {children}
      </main>
    </div>
  );
}
