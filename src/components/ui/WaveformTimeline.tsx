"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveformTimelineProps {
  state: "waveform" | "timeline";
  className?: string;
}

export function WaveformTimeline({ state, className }: WaveformTimelineProps) {
  // Waveform is jagged lines
  const waveformPath = "M 0 20 L 10 5 L 20 35 L 30 15 L 40 25 L 50 10 L 60 30 L 70 5 L 80 20 L 90 15 L 100 20";
  // Timeline is a straight horizontal line with some tick marks
  const timelinePath = "M 0 20 L 10 20 L 20 20 L 30 20 L 40 20 L 50 20 L 60 20 L 70 20 L 80 20 L 90 20 L 100 20";
  
  // Actually, animating a single path between waveform and straight line.
  // We can just use framer motion to interpolate the `d` attribute.

  return (
    <div className={cn("w-full h-12 relative flex items-center justify-center", className)}>
      <svg 
        viewBox="0 0 100 40" 
        preserveAspectRatio="none" 
        className="w-full h-full overflow-visible"
      >
        <motion.path
          d={state === "waveform" ? waveformPath : timelinePath}
          animate={{ d: state === "waveform" ? waveformPath : timelinePath }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          fill="transparent"
          stroke="var(--color-cyan)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Tick marks for timeline state */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: state === "timeline" ? 1 : 0 }}
          transition={{ duration: 0.3, delay: state === "timeline" ? 0.3 : 0 }}
          stroke="var(--color-cyan)"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="20" y1="15" x2="20" y2="25" />
          <line x1="50" y1="15" x2="50" y2="25" />
          <line x1="80" y1="15" x2="80" y2="25" />
        </motion.g>
      </svg>
    </div>
  );
}
