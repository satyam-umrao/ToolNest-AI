"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Pipette,
  Menu,
  X,
  Sparkles,
  Home,
  ExternalLink,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="w-5 h-5" />,
  },
  {
    title: "PDF Tools",
    href: "/pdf",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: "Image Tools",
    href: "/image",
    icon: <ImageIcon className="w-5 h-5" />,
  },
  {
    title: "Color Picker",
    href: "/color-picker",
    icon: <Pipette className="w-5 h-5" />,
  },
  {
    title: "Gemini Watermark",
    href: "/watermark",
    icon: <Sparkles className="w-5 h-5" />,
    badge: "Lossless",
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 space-y-1.5 py-4">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <div key={item.href} className="relative">
            <Link
              href={item.href}
              prefetch={true}
              onClick={onItemClick}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors duration-200 select-none group",
                isActive
                  ? "text-white font-semibold"
                  : "text-muted-foreground hover:text-white hover:bg-white/[0.04]",
              )}
            >
              {/* Active Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-primary/25 to-purple-500/15 border border-primary/40 rounded-2xl shadow-inner shadow-primary/20"
                />
              )}

              <span
                className={cn(
                  "relative z-10 transition-transform duration-200 group-hover:scale-110 shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-white",
                )}
              >
                {item.icon}
              </span>
              <span className="relative z-10 flex-1 truncate">
                {item.title}
              </span>
              {item.badge && (
                <span className="relative z-10 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 shrink-0">
                  {item.badge}
                </span>
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );

  const renderFooter = () => (
    <div className="mt-auto pt-5 border-t border-white/10 space-y-4">
      <div className="glass-card p-4 rounded-2xl border border-white/10 text-center space-y-3 relative overflow-hidden group">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/15 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-pink-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15  shadow-lg shadow-indigo-500/20 mb-2.5 flex items-center justify-center transform-gpu transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/org-logo.png"
              alt="Technologies Satyam"
              width={50}
              height={50}
              className="w-full h-full object-cover drop-shadow-md rounded-full"
            />
          </div>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Organization
          </p>
          <h3 className="text-sm font-bold text-white mt-0.5">
            Technologies Satyam
          </h3>
        </div>

        <div className="h-px w-10 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60" />

        <div className="space-y-4 ">
          <a
            href="https://github.com/Technologies-Satyam"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-white/90 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>GitHub Organization</span>
          </a>

          <a
            href="https://github.com/Technologies-Satyam/ToolNest-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <span>Github Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="text-[11px] text-center text-muted-foreground/80 space-y-0.5">
        <p>100% Client-Side • $0 Forever</p>
        <p className="text-[10px]">© 2026 ToolNest AI</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Fixed Top Header Bar (< lg) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 px-4 bg-[#0a0e1a]/85 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between shadow-lg">
        <Link href="/" prefetch={true} className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-indigo-500/20 bg-white/5 border border-white/10 p-0.5 flex items-center justify-center">
            <Image
              src="/logo-icon.png"
              alt="ToolNest AI Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-base gradient-text leading-tight block">
              ToolNest AI
            </span>
            <span className="text-[10px] text-emerald-400 font-medium leading-none block">
              $0 Client-Side
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white flex items-center justify-center shadow-md"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* 2. Mobile Drawer & Backdrop with AnimatePresence (< lg) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Slide-in Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 w-[290px] max-w-[85vw] bg-[#0b0f19] border-r border-white/10 p-5 flex flex-col custom-scrollbar overflow-y-auto shadow-2xl z-10"
            >
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <Link
                  href="/"
                  prefetch={true}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 select-none"
                >
                  <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-indigo-500/20 bg-white/5 border border-white/10 p-0.5 flex items-center justify-center">
                    <Image
                      src="/logo-icon.png"
                      alt="ToolNest AI Logo"
                      width={36}
                      height={36}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-base font-bold gradient-text leading-tight">
                      ToolNest AI
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      100% Client-Side
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10 transition-colors"
                  aria-label="Close Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              {renderNavLinks(() => setIsOpen(false))}

              {/* Footer Profile */}
              {renderFooter()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Desktop Persistent Sidebar (>= lg) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 glass-card border-r border-white/10 flex-col p-6 z-30 custom-scrollbar overflow-y-auto">
        {/* Logo */}
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-3 mb-6 group select-none"
        >
          <div className="relative transform-gpu transition-transform duration-300 group-hover:scale-105">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center ">
              <Image
                src="/logo-icon.png"
                alt="ToolNest AI Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -inset-1 rounded-2xl opacity-30 blur-sm animate-glow" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text leading-tight">
              ToolNest AI
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              100% Client-Side Suite
            </p>
          </div>
        </Link>

        {/* Navigation */}
        {renderNavLinks()}

        {/* Footer */}
        {renderFooter()}
      </aside>
    </>
  );
}
