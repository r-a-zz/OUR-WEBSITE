import React, { memo } from "react";

const NavigationItem = memo(({ item, isActive, onClick }) => {
  const IconComponent = item.icon;

  const handleClick = () => {
    console.log("NavigationItem clicked:", item.id); // Debug log
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-3 rounded-lg transition-colors duration-100 relative group border touch-manipulation ${
        isActive
          ? "bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-violet-500/20 text-cyan-200 border-cyan-400/50"
          : "text-white/70 hover:text-cyan-200 border-transparent hover:border-cyan-500/30 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10"
      }`}
      style={
        isActive
          ? {
              boxShadow: "0 0 10px rgba(34, 211, 238, 0.15)",
            }
          : {}
      }
      aria-label={`Navigate to ${item.label}`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 via-blue-400 to-purple-400" />
      )}

      {/* Icon */}
      <div
        className={`relative z-10 transition-colors duration-100 flex-shrink-0 ${
          isActive ? "text-cyan-300" : ""
        }`}
      >
        <IconComponent size={16} className="sm:w-[18px] sm:h-[18px]" />
      </div>

      {/* Label */}
      <span
        className={`font-medium relative z-10 transition-colors duration-100 text-sm sm:text-base truncate ${
          isActive ? "text-cyan-200" : ""
        }`}
      >
        {item.label}
      </span>

      {/* Simple active indicator */}
      {isActive && (
        <div className="ml-auto flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>
      )}
    </button>
  );
});

NavigationItem.displayName = "NavigationItem";

export default NavigationItem;
