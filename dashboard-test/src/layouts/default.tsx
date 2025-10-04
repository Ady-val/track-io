export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen bg-blue-950 overflow-auto">
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16 overflow-auto">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <p className="text-primary">TrackIO</p>
      </footer>
    </div>
  );
}
