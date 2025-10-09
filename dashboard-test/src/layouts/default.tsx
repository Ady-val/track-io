import type React from "react";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="relative flex flex-col h-screen bg-slate-900 overflow-auto">
      <main className="container mx-auto max-w-7xl flex-grow p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
