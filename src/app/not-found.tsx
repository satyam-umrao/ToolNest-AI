import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-center shadow-xl shadow-indigo-500/20">
          <Image
            src="/logo-icon.png"
            alt="ToolNest AI Logo"
            width={64}
            height={64}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <span className="badge text-xs mb-3">404 Error</span>
      <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-white">Page Not Found</h1>
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-8">
        The tool or page you are looking for does not exist or has been moved.
      </p>

      <Link
        href="/"
        prefetch={true}
        className="btn-premium px-6 py-3 text-sm font-semibold flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
