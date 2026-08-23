import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Sparkles, Cpu, Lock, ArrowRight } from 'lucide-react';
import ToolCard from '@/components/ToolCard';

type IconType = 'pdf' | 'image' | 'color' | 'watermark';

export const metadata: Metadata = {
  title: 'Dashboard | ToolNest AI',
  description: '100% Client-Side tools running directly on your device with $0 server cost forever',
};

const tools: {
  title: string;
  description: string;
  icon: IconType;
  href: string;
  gradient: string;
  badge?: string;
}[] = [
  {
    title: 'PDF Tools Suite',
    description:
      'Merge, split, remove/reorder pages, convert images to PDF, and stamp text/annotations. 100% client-side in-memory processing.',
    icon: 'pdf',
    href: '/pdf',
    gradient: 'bg-gradient-to-br from-blue-500/15 to-cyan-500/15',
    badge: '100% Client-Side',
  },
  {
    title: 'Image Tools Suite',
    description:
      'Crop, resize, rotate, enhance with custom filters, and remove backgrounds with in-browser Wasm AI.',
    icon: 'image',
    href: '/image',
    gradient: 'bg-gradient-to-br from-purple-500/15 to-pink-500/15',
    badge: 'AI Wasm',
  },
  {
    title: 'Color Picker & Palette',
    description:
      'Sample screen colors via EyeDropper API, inspect image pixels with magnifier loupe, and extract dominant palettes.',
    icon: 'color',
    href: '/color-picker',
    gradient: 'bg-gradient-to-br from-green-500/15 to-teal-500/15',
    badge: 'EyeDropper',
  },
  {
    title: 'Gemini Watermark Remover',
    description:
      'Mathematically precise Reverse Alpha Blending for lossless removal of Gemini AI watermarks with before/after slider & batch export.',
    icon: 'watermark',
    href: '/watermark',
    gradient: 'bg-gradient-to-br from-orange-500/15 to-rose-500/15',
    badge: 'Reverse Alpha',
  },
];

const features = [
  {
    icon: Cpu,
    title: '$0 Cost Forever',
    description: 'Runs 100% on your device using WebAssembly, WebGL & Canvas API without expensive servers.',
  },
  {
    icon: Lock,
    title: 'Complete Privacy',
    description: 'Your PDFs, photos, and files never leave your browser or upload to external servers.',
  },
  {
    icon: Zap,
    title: 'Zero Latency',
    description: 'Instant client-side in-memory execution without network upload/download lag.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-12">
      {/* HERO SECTION */}
      <section className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 rounded-3xl blur-3xl opacity-50 pointer-events-none" />

        <div className="relative glass-card p-8 sm:p-12 md:p-14 rounded-3xl border border-white/10 overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/5 border border-white/15 text-white text-xs font-semibold backdrop-blur-md shadow-lg">
              <div className="w-6 h-6 rounded-lg overflow-hidden bg-white/10 p-0.5 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo-icon.png"
                  alt="ToolNest AI"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <span>100% Client-Side Engine • $0 Server Cost Forever</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Privacy-First Tools for
              <span className="gradient-text"> Document & Image </span>
              Processing
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Blazing-fast, private tools powered by pure JavaScript, Canvas, and Wasm. Your files are processed strictly inside your device memory.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/pdf"
                prefetch={true}
                className="btn-premium px-7 py-3.5 text-center text-sm font-semibold flex items-center gap-2"
              >
                <span>Explore PDF Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/image"
                prefetch={true}
                className="glass-card px-7 py-3.5 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98] transition-all text-center text-sm font-semibold text-white/90 border border-white/10"
              >
                Explore Image Tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 transform-gpu group"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-1.5 text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* ALL TOOLS */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-bold text-white">All Client-Side Tools</h2>
          <p className="text-muted-foreground text-sm">
            Zero file size limits, zero tracking, zero server costs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool, idx) => (
            <ToolCard key={tool.href} {...tool} index={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}
