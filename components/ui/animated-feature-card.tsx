import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils"; // Assuming you have a `cn` utility from shadcn

// Define the props for the component, omitting 'title' from HTMLAttributes to prevent ReactNode conflicts
export interface AnimatedFeatureCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The numerical index to display, e.g., "001" */
  index: string;
  /** The tag or category label */
  tag: string;
  /** The main title or description */
  title: React.ReactNode;
  /** The URL for the central image */
  imageSrc: string;
  /** The color variant which determines the gradient and tag color */
  color: "orange" | "purple" | "blue" | "green";
}

// Define HSL color values for each variant to work with shadcn's theming
const colorVariants = {
  orange: {
    '--feature-color': 'hsl(35, 91%, 55%)',
    '--feature-color-light': 'hsl(41, 100%, 85%)',
    '--feature-color-dark': 'hsl(24, 98%, 98%)',
  },
  purple: {
    '--feature-color': 'hsl(262, 85%, 60%)',
    '--feature-color-light': 'hsl(261, 100%, 87%)',
    '--feature-color-dark': 'hsl(264, 100%, 98%)',
  },
  blue: {
    '--feature-color': 'hsl(211, 100%, 60%)',
    '--feature-color-light': 'hsl(210, 100%, 83%)',
    '--feature-color-dark': 'hsl(216, 100%, 98%)',
  },
  green: {
    '--feature-color': 'hsl(142, 71%, 45%)',
    '--feature-color-light': 'hsl(142, 50%, 85%)',
    '--feature-color-dark': 'hsl(142, 30%, 98%)',
  },
};

const AnimatedFeatureCard = React.forwardRef<
  HTMLDivElement,
  AnimatedFeatureCardProps
>(({ className, index, tag, title, imageSrc, color, ...props }, ref) => {
  const cardStyle = colorVariants[color] as React.CSSProperties;

  return (
    <motion.div
      ref={ref}
      style={cardStyle}
      className={cn(
        "relative flex h-[380px] w-full flex-col justify-end overflow-hidden rounded-2xl border border-secondary-200 bg-white p-6 shadow-xl shadow-secondary-100",
        className
      )}
      whileHover="hover"
      initial="initial"
      variants={{
        initial: { y: 0 },
        hover: { y: -10 },
      }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      {...props}
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0 z-0 opacity-40 dark:opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 30%, var(--feature-color-light) 0%, transparent 70%)`
        }}
      />
      
      {/* Index Number */}
      <div className="absolute top-6 left-6 font-mono text-lg font-bold text-secondary-300">
        {index}
      </div>

      {/* Main Image */}
      <motion.div 
        className="absolute inset-0 z-10 flex items-center justify-center"
        variants={{
            initial: { scale: 1, y: 0 },
            hover: { scale: 1.1, y: -10 },
        }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <img
          src={imageSrc}
          alt={tag}
          className="w-48 h-48 object-contain drop-shadow-xl"
        />
      </motion.div>
      
      {/* Content */}
      <div className="relative z-20 rounded-xl border border-white/50 bg-white/80 p-5 backdrop-blur-md shadow-sm">
        <span
          className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest"
          style={{ 
            backgroundColor: 'var(--feature-color-dark)', 
            color: 'var(--feature-color)' 
          }}
        >
          {tag}
        </span>
        <p className="text-sm font-bold text-secondary-800 leading-relaxed">{title}</p>
      </div>
    </motion.div>
  );
});
AnimatedFeatureCard.displayName = "AnimatedFeatureCard";

export { AnimatedFeatureCard };
