import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export interface CardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverEffect ? { scale: 1.02 } : undefined}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "bg-white rounded-[24px] p-6 shadow-sm border border-sage/20",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";
