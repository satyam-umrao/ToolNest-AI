'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Image as ImageIcon, Pipette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconType = 'pdf' | 'image' | 'color' | 'watermark';

const ICONS: Record<IconType, React.ElementType> = {
  pdf: FileText,
  image: ImageIcon,
  color: Pipette,
  watermark: Sparkles,
};

export interface ToolCardProps {
  title: string;
  description: string;
  icon: IconType;
  href: string;
  gradient: string;
  badge?: string;
  index?: number;
}

export default function ToolCard({
  title,
  description,
  icon,
  href,
  gradient,
  badge,
  index = 0,
}: ToolCardProps) {
  const Icon = ICONS[icon] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="w-full transform-gpu"
    >
      <Link href={href} prefetch={true} className="block h-full select-none">
        <div className="tool-card group relative overflow-hidden h-full flex flex-col justify-between">
          {/* Subtle Ambient Hover Glow */}
          <div
            className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl',
              gradient
            )}
          />

          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-13 h-13 p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-300 flex items-center justify-center text-primary group-hover:scale-105 transform-gpu shadow-lg shadow-black/30">
                <Icon className="w-6 h-6" />
              </div>

              {badge && (
                <span className="badge text-[11px] font-semibold tracking-wide">
                  {badge}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors duration-200">
                {title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-primary group-hover:text-white transition-colors">
            <span>Launch Tool</span>
            <ArrowRight className="w-4 h-4 transform-gpu transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
