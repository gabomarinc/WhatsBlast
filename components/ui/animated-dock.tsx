import * as React from "react";
import { useRef } from "react";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...args: ClassValue[]) => twMerge(clsx(args));

export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}

export interface DockItemData {
  link?: string;
  Icon: React.ReactNode;
  target?: string;
  onClick?: () => void;
  label?: string;
  isActive?: boolean;
}

export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-16 items-end gap-4 rounded-2xl bg-secondary-900/90 backdrop-blur-md border border-primary-500/20 shadow-2xl px-4 pb-3",
        className
      )}
    >
      {items.map((item, index) => (
        <DockItem key={index} mouseX={mouseX} isActive={item.isActive}>
          {item.onClick ? (
            <button
              onClick={item.onClick}
              title={item.label}
              className="grow flex items-center justify-center w-full h-full text-white focus:outline-none"
            >
              {item.Icon}
            </button>
          ) : (
            <a
              href={item.link}
              target={item.target}
              title={item.label}
              className="grow flex items-center justify-center w-full h-full text-white"
            >
              {item.Icon}
            </a>
          )}
        </DockItem>
      ))}
    </motion.div>
  );
};

interface DockItemProps {
  mouseX: MotionValue<number>;
  children: React.ReactNode;
  isActive?: boolean;
}

export const DockItem = ({ mouseX, children, isActive = false }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(width, [40, 70], [1, 1.35]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn(
        "aspect-square w-10 rounded-full flex items-center justify-center transition-colors duration-250",
        isActive 
          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" 
          : "bg-secondary-800 text-secondary-300 hover:bg-secondary-750 hover:text-white"
      )}
    >
      <motion.div
        style={{ scale: iconSpring }}
        className="flex items-center justify-center w-full h-full grow"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
