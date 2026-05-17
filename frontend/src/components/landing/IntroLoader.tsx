"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function IntroLoader() {
  const [show, setShow] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    
    // Developer query param to force replay the intro animation easily
    const params = new URLSearchParams(window.location.search);
    if (params.get("replay") === "true") {
      localStorage.removeItem("flowgov_intro_seen");
    }

    // Check if user has already seen the onboarding intro
    const hasSeenIntro = localStorage.getItem("flowgov_intro_seen");
    if (!hasSeenIntro || hasSeenIntro === "false") {
      // Set to false in localstorage initially if never set
      if (!hasSeenIntro) {
        localStorage.setItem("flowgov_intro_seen", "false");
      }
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (show) {
      // Elegant 3.2s timer for typing animation + glow to complete before fadeout
      const timer = setTimeout(() => {
        setShow(false);
        localStorage.setItem("flowgov_intro_seen", "true");
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!mounted) return null;

  const flowLetters = ["F", "l", "o", "w"];
  const govLetters = ["G", "o", "v"];

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const letterVariants = {
    initial: { 
      opacity: 0, 
      filter: "blur(12px)", 
      y: 15,
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      filter: "blur(0px)", 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] // Custom easeOutExpo
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 0.15, 
      scale: 1,
      transition: { 
        delay: 1.2,
        duration: 1.5,
        ease: "easeOut"
      }
    }
  };

  const lineVariants = {
    initial: { width: 0, opacity: 0 },
    animate: { 
      width: "120px", 
      opacity: 0.8,
      transition: { 
        delay: 1.4,
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            filter: "blur(20px)",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/98 backdrop-blur-2xl select-none pointer-events-none"
        >
          {/* Subtle Ambient Radial Glowing Background behind the logo */}
          <motion.div
            variants={glowVariants}
            initial="initial"
            animate="animate"
            className="absolute w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px] -z-10"
          />

          {/* Typing/Blur Reveal Brand Text */}
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="flex items-center text-5xl md:text-7xl font-extrabold tracking-tighter"
          >
            {/* Flow (Default text color) */}
            <div className="flex text-foreground">
              {flowLetters.map((char, index) => (
                <motion.span key={`flow-${index}`} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Gov (Primary theme color) */}
            <div className="flex text-primary">
              {govLetters.map((char, index) => (
                <motion.span key={`gov-${index}`} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Underline aesthetic loader bar */}
          <motion.div 
            variants={lineVariants}
            initial="initial"
            animate="animate"
            className="h-[2px] bg-primary rounded-full mt-6 shadow-lg shadow-primary/50"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
