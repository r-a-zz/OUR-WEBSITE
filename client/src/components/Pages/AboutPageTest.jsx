import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Sparkles,
  Calendar,
  MessageCircle,
  Ring,
  Star,
} from "lucide-react";

const AboutPageTest = () => {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-6">About Us</h1>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Heart className="text-red-400" size={24} />
          <span className="text-2xl text-white/90 font-medium">
            Our Love Story
          </span>
          <Heart className="text-red-400" size={24} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-pink-400/20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Naina my love RADHA ❤🥰😍✨
          </h2>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-4xl mx-auto">
            In this beautiful journey of love, we found each other and created a
            story that will last forever. From the first message to our promise
            of eternal togetherness, every moment has been magical. This is our
            story - a tale of two hearts that beat as one, two souls destined to
            be together.
          </p>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          CHAPTERS of Our LIFE
        </h2>
        <p className="text-white/70 text-lg">
          Every milestone that brought us closer together
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-gradient-to-br from-pink-500/20 to-red-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl">
              <MessageCircle className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">DM</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-pink-400" size={16} />
            <span className="text-lg font-semibold text-pink-200">
              9th March
            </span>
          </div>
          <p className="text-white/90 mb-4">
            The very first message that changed everything
          </p>
          <div className="text-2xl">❤❤❤</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                ❤Radhakrishna❤
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-pink-400" size={16} />
            <span className="text-lg font-semibold text-pink-200">
              26th April
            </span>
          </div>
          <p className="text-white/90 mb-4">
            When our souls recognized each other
          </p>
          <div className="text-2xl">🥰🥰🥰</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                The TRANSITION
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-pink-400" size={16} />
            <span className="text-lg font-semibold text-pink-200">
              12th Oct
            </span>
          </div>
          <p className="text-white/90 mb-4">
            Everything started to change beautifully
          </p>
          <div className="text-2xl">❤</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                TURNING POINT + DIL se DIL Connection
              </h3>
              <p className="text-sm text-white/70 italic">(both sides)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-pink-400" size={16} />
            <span className="text-lg font-semibold text-pink-200">
              22nd Oct
            </span>
          </div>
          <p className="text-white/90 mb-4">
            Hearts connected, souls intertwined
          </p>
          <div className="text-2xl">😍🥰❤</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-pink-500 rounded-xl">
              <Ring className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Propose
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-pink-400" size={16} />
            <span className="text-lg font-semibold text-pink-200">
              29th November
            </span>
          </div>
          <p className="text-white/90 mb-4">
            The most magical moment of our lives
          </p>
          <div className="text-2xl">✨😍❤</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
              <Star className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                A Strong Promise to marry
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-pink-400" size={16} />
            <span className="text-lg font-semibold text-pink-200">
              2nd February
            </span>
          </div>
          <p className="text-white/90 mb-4">
            Forever and always, our eternal promise
          </p>
          <div className="text-2xl">🤩🤩🤩🔥🔥🔥✨✨✨❤❤❤</div>
        </div>
      </div>

      <div className="text-center bg-gradient-to-r from-pink-900/20 via-purple-900/20 to-red-900/20 backdrop-blur-md rounded-3xl p-8 border border-pink-400/20">
        <Heart className="text-red-400 mx-auto mb-4" size={48} />
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Forever & Always
        </h3>
        <p className="text-white/90 text-lg max-w-2xl mx-auto">
          This is just the beginning of our beautiful journey together. Every
          day we write new chapters filled with love, laughter, and endless
          happiness. Here's to our forever! ❤️✨
        </p>
      </div>
    </div>
  );
};

export default AboutPageTest;
