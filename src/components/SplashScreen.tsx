'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if splash has already played this session
    const hasSeenSplash = sessionStorage.getItem('toolnest_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    // Smoothly hide splash after sequence
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('toolnest_splash_seen', 'true');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            filter: 'blur(12px)',
            scale: 1.04,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070a12] overflow-hidden pointer-events-none select-none"
        >
          {/* Ambient Glows matched to ToolNest AI Indigo / Violet / Pink Theme */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#6366f1]/15 blur-[140px] pointer-events-none" />
          <div className="absolute w-[350px] h-[350px] rounded-full bg-[#ec4899]/15 blur-[120px] translate-y-12 pointer-events-none" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[#a855f7]/15 blur-[100px] -translate-x-12 pointer-events-none" />

          {/* Loader and Text Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center gap-12 z-10"
          >
            {/* Young Walrus Recreated Loader with ToolNest AI Palette */}
            <div className="walrus-loader">
              <div className="blob-core"></div>

              {/* Invisible SVG for the Gooey Filter */}
              <svg width="0" height="0">
                <defs>
                  <filter id="goo">
                    <feGaussianBlur
                      in="SourceGraphic"
                      stdDeviation="6"
                      result="blur"
                    />
                    <feColorMatrix
                      in="blur"
                      mode="matrix"
                      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                      result="goo"
                    />
                    <feBlend in="SourceGraphic" in2="goo" />
                  </filter>
                </defs>
              </svg>
            </div>

            {/* Website Name & Tagline */}
            <div className="flex flex-col items-center gap-2">
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-2xl sm:text-3xl font-extrabold tracking-widest text-white/90 uppercase flex items-center gap-2.5"
                style={{ textShadow: '0px 0px 25px rgba(99, 102, 241, 0.45)' }}
              >
                Toolnest
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] via-[#c084fc] to-[#f472b6]">
                  AI
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
              >
                100% Client-Side Processing Suite
              </motion.p>
            </div>
          </motion.div>

          {/* Raw CSS for the precise glowing lava effect customized to ToolNest AI */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .walrus-loader {
              --color-one: #818cf8;
              --color-two: #ec4899;
              --color-three: rgba(99, 102, 241, 0.6);
              --color-four: rgba(236, 72, 153, 0.55);
              --color-five: rgba(129, 140, 248, 0.25);
              --time-animation: 2s;
              --size: 1.1;
              
              position: relative;
              width: 100px;
              height: 100px;
              border-radius: 50%;
              transform: scale(var(--size));
              box-shadow: 0 0 30px 0 var(--color-three), 0 20px 55px 0 var(--color-four);
              animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* Outer Ring and Inner Shadow Layer */
            .walrus-loader::before {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: 50%;
              border-top: solid 1.5px var(--color-one);
              border-bottom: solid 1.5px var(--color-two);
              background: linear-gradient(180deg, var(--color-five), var(--color-four));
              box-shadow: inset 0 10px 12px 0 var(--color-three), inset 0 -10px 12px 0 var(--color-four);
              z-index: 1;
            }

            /* Animated Core (The gooey bubbling liquid) */
            .walrus-loader .blob-core {
              position: absolute;
              inset: 0;
              filter: url(#goo);
              z-index: 2;
            }

            .walrus-loader .blob-core::before, 
            .walrus-loader .blob-core::after {
              content: '';
              position: absolute;
              background: linear-gradient(180deg, var(--color-one) 0%, var(--color-two) 100%);
              width: 80%;
              height: 80%;
              top: 10%;
              left: 10%;
              animation: morphing calc(var(--time-animation) * 2.5) linear infinite;
              border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%;
            }

            .walrus-loader .blob-core::after {
              animation-direction: reverse;
              animation-duration: calc(var(--time-animation) * 2);
              width: 75%;
              height: 75%;
              top: 12.5%;
              left: 12.5%;
              border-radius: 60% 40% 30% 70% / 50% 60% 40% 40%;
              background: linear-gradient(0deg, var(--color-one) 0%, var(--color-two) 100%);
            }

            @keyframes morphing {
              0% { transform: rotate(0deg); border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; }
              50% { border-radius: 60% 40% 30% 70% / 50% 60% 40% 40%; }
              100% { transform: rotate(360deg); border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; }
            }

            @keyframes colorize {
              0%, 100% { filter: hue-rotate(0deg); }
              50% { filter: hue-rotate(20deg) brightness(1.15); }
            }
          `,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
