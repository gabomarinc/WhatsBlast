import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export type TabItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string; // pill background color when active
};

export type ExpandableTabsProps = {
  tabs: TabItem[];
  activeTabId: string;
  onChangeTab: (id: string) => void;
  className?: string;
};

export const ExpandableTabs = ({
  tabs,
  activeTabId,
  onChangeTab,
  className,
}: ExpandableTabsProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 p-2 rounded-2xl bg-secondary-50/50 border border-secondary-100/50 shadow-inner overflow-hidden",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const Icon = tab.icon;

        return (
          <motion.div
            key={tab.id}
            layout
            className={cn(
              "flex items-center justify-center rounded-xl cursor-pointer overflow-hidden h-11 px-3 transition-colors duration-250 select-none",
              isActive ? `${tab.color} text-white shadow-md shadow-secondary-900/10` : "bg-transparent text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100/30"
            )}
            onClick={() => onChangeTab(tab.id)}
            initial={false}
            animate={{
              width: isActive ? "auto" : "44px",
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          >
            <motion.div
              className="flex items-center justify-center"
              initial={{ filter: "blur(4px)", opacity: 0.8 }}
              animate={{ filter: "blur(0px)", opacity: 1 }}
              exit={{ filter: "blur(4px)", opacity: 0.8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Icon className={cn("flex-shrink-0 w-4 h-4 aspect-square", isActive ? "text-white" : "text-current")} />
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    className="ml-2.5 text-xs font-black tracking-wide uppercase whitespace-nowrap"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ originX: 0 }}
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};
