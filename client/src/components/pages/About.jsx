import React from "react";

export default function About() {
  return (
    <div className="space-y-8">
      <h1 className="text-5xl font-bold text-white mb-8">About Us</h1>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <p className="text-lg text-white/90 leading-relaxed mb-6">
          We are a passionate team dedicated to creating exceptional digital
          experiences.
        </p>
      </div>
    </div>
  );
}
