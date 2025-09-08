import React from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useScrollDirection, useWindowSize } from "../../hooks";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const scrollDirection = useScrollDirection();
  const { height } = useWindowSize();

  React.useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > height * 0.3) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [height]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible || scrollDirection === "up") return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 p-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 z-50 border border-cyan-400/30"
      style={{
        background:
          "linear-gradient(135deg, rgba(34, 211, 238, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)",
        boxShadow:
          "0 8px 32px rgba(34, 211, 238, 0.3), 0 0 0 1px rgba(34, 211, 238, 0.2)",
      }}
      aria-label="Scroll to top"
    >
      <ArrowUp size={20} />
    </motion.button>
  );
};

export default ScrollToTop;
