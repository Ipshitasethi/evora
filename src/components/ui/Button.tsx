import React from "react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-coral/50 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-coral text-white hover:bg-coral/90",
      secondary: "border-2 border-plum text-plum hover:bg-plum/5",
      ghost: "text-plum hover:bg-plum/5",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
