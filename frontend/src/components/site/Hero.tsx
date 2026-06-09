"use client";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef } from "react";
import hero from "@/assets/scene-hero.jpg";
import { SplitWord } from "./motion-primitives";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, reduce ? 1.05 : 1.18]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-30%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);
  const vignette = useTransform(scrollYProgress, [0, 1], [0, 0.35]);

  return (
    <section ref={ref} className="relative min-h-screen w-full overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
        <img
          src={hero}
          alt="Illustrated calm ocean with two sailboats and a golden sun"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </motion.div>

      {/* Soft drifting overlay clouds */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[18%] h-32 opacity-60 mix-blend-screen"
        animate={reduce ? undefined : { x: ["-2%", "2%"] }}
        transition={{ duration: 22, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(60% 100% at 30% 50%, oklch(0.98 0.02 80 / 0.6), transparent), radial-gradient(40% 100% at 70% 60%, oklch(0.98 0.02 80 / 0.45), transparent)",
        }}
      />

      {/* Vignette as you scroll */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-background"
        style={{ opacity: vignette }}
      />

      <motion.div
        className="relative pt-40 md:pt-44 px-6 md:px-10 mx-auto max-w-[1600px]"
        style={{ y: titleY, opacity: titleOpacity }}
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow"
        >
          Season V · Fantasy Edition
        </motion.p>

        <h1 className="mt-6 font-display text-[18vw] md:text-[15vw] leading-[0.85] text-ink overflow-hidden">
          <SplitWord text="SailGP" delay={0.2} />
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 md:mt-4 flex flex-wrap items-end gap-x-8 gap-y-2"
        >
          <span className="font-display italic text-3xl md:text-5xl text-teal">— fantasy</span>
          <span className="font-mono text-xs text-ink/60">·  build · forecast · follow</span>
        </motion.div>
      </motion.div>

      {/* Scroll badge */}
      <motion.a
        href="#race"
        aria-label="Scroll"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.08 }}
        className="absolute bottom-10 right-6 md:right-12 h-24 w-24 grid place-items-center"
      >
        <svg className="absolute inset-0 animate-spin-slow text-ink" viewBox="0 0 120 120">
          <defs>
            <path id="circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
          </defs>
          <text className="font-mono" fontSize="9" letterSpacing="3" fill="currentColor">
            <textPath href="#circle">SCROLL · DOWN · SCROLL · DOWN · </textPath>
          </text>
        </svg>
        <motion.span
          animate={reduce ? undefined : { y: [0, 4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="h-12 w-12 rounded-full bg-ink grid place-items-center text-gold"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.span>
      </motion.a>
    </section>
  );
}
