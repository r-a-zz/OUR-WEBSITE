import React from "react";

export default function Home() {
  return (
    <div className="space-y-8 text-center">
      <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
        Welcome to Our{" "}
        <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Amazing Website
        </span>
      </h1>
      <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
        Experience the future of web design with stunning visuals and seamless
        interactions
      </p>
    </div>
  );
}
