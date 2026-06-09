"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function FloatingDemo() {
  const [visible, setVisible] = useState(false);

  // Show after 1.5s so it doesn't compete with the hero entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2"
        >
          {/* Judge label */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="eyebrow !text-[7px] text-ink/50 mr-1"
          >
            For judges
          </motion.span>

          {/* Main button */}
          <motion.a
            href="/app?demo=1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="group flex items-center gap-3 bg-ink text-cream pl-5 pr-2 py-2 rounded-full shadow-[0_8px_32px_oklch(0.14_0.02_215/0.25)] hover:shadow-[0_12px_40px_oklch(0.14_0.02_215/0.35)] transition-shadow"
          >
            <span className="text-sm font-sans font-medium tracking-wide">Run full demo</span>
            <span className="h-9 w-9 rounded-full bg-gold text-ink grid place-items-center group-hover:bg-gold/80 transition-colors shrink-0">
              {/* Play triangle */}
              <svg className="h-3.5 w-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </span>
          </motion.a>

          {/* Pulse ring behind button */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: "radial-gradient(circle, oklch(0.72 0.14 80 / 0.4), transparent 70%)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
