import React from "react";

export default function Planner() {
  return (
    <div className="space-y-8">
      <h1 className="text-5xl font-bold text-white mb-8">My Plans</h1>
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-2xl font-semibold text-white mb-3">Plan{i}</h3>
            <p className="text-white/70 mb-4">
              Published on January{i + 10}, 2024
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
