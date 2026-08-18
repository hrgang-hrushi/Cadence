"use client";

import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RecordButtonProps {
  isRecording?: boolean;
  onClick?: () => void;
}

export function RecordButton({ isRecording = false, onClick }: RecordButtonProps) {
  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
      <div className="glass-panel p-2 rounded-[32px] flex items-center justify-center pointer-events-auto shadow-lg shadow-black/10">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={onClick}
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center text-white transition-colors duration-300 relative",
            isRecording ? "bg-cyan" : "bg-primary"
          )}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording && (
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-cyan opacity-50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          )}
          <Mic className="w-7 h-7" strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  );
}
