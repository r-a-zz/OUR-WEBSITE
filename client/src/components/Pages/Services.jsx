import React from "react";
import YouTubeMusicCard from "../ui/YouTubeMusicCard";

export default function Services() {
  return (
    <div className="space-y-8">
      <h1
        className="text-5xl font-bold text-white mb-8"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        At your Service ma'am !
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <YouTubeMusicCard />
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <h3 className="text-2xl font-semibold text-white mb-4">
            UI/UX Design
          </h3>
          <p className="text-white/80">
            Beautiful and intuitive user interfaces that enhance user
            experience.
          </p>
        </div>
      </div>
    </div>
  );
}
