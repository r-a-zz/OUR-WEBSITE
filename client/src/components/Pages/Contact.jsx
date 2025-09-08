import React from "react";

export default function Contact() {
  return (
    <div className="space-y-8">
      <h1 className="text-5xl font-bold text-white mb-8">Contact Us</h1>
      <div className="max-w-2xl">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="space-y-6">
            <label className="block text-white/90 mb-2 font-semibold">
              Name
            </label>
            <input
              className="w-full px-4 py-3 bg-white/10 rounded-lg text-white placeholder-white/50"
              placeholder="Your name"
            />
            <label className="block text-white/90 mb-2 font-semibold">
              Message
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 bg-white/10 rounded-lg text-white placeholder-white/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
