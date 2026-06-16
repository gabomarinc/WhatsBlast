import { motion } from "framer-motion";

export const TimelineContent = ({
  as = "div",
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}: any) => {
  const Component = (motion as any)[as] || motion.div;
  return (
    <Component
      variants={customVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={animationNum}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
};
