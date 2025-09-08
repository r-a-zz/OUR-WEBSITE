import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  Sparkles,
  Calendar,
  MessageCircle,
  Diamond,
  Star,
} from "lucide-react";

const AboutPage = () => {
  // Memoize timeline data so it's not recreated on every render
  const timelineEvents = React.useMemo(
    () => [
      {
        icon: MessageCircle,
        title: "DM",
        date: "9th March",
        description: "The very first message that changed everything",
        emoji: "❤❤❤",
        color: "from-pink-500 to-red-500",
        gradient: "from-pink-500/20 to-red-500/20",
      },
      {
        icon: Heart,
        title: "❤Radhakrishna❤",
        date: "26th April",
        description: "When our souls recognized each other",
        emoji: "🥰🥰🥰",
        color: "from-purple-500 to-pink-500",
        gradient: "from-purple-500/20 to-pink-500/20",
      },
      {
        icon: Sparkles,
        title: "The TRANSITION",
        date: "12th Oct",
        description: "Everything started to change beautifully",
        emoji: "❤",
        color: "from-blue-500 to-purple-500",
        gradient: "from-blue-500/20 to-purple-500/20",
      },
      {
        icon: Heart,
        title: "TURNING POINT + DIL se DIL Connection",
        subtitle: "(both sides)",
        date: "22nd Oct",
        description: "Hearts connected, souls intertwined",
        emoji: "😍🥰❤",
        color: "from-red-500 to-pink-500",
        gradient: "from-red-500/20 to-pink-500/20",
      },
      {
        icon: Diamond,
        title: "Propose",
        date: "29th November",
        description: "The most magical moment of our lives",
        emoji: "✨😍❤",
        color: "from-yellow-500 to-pink-500",
        gradient: "from-yellow-500/20 to-pink-500/20",
      },
      {
        icon: Star,
        title: "A Strong Promise to marry",
        date: "2nd February",
        description: "Forever and always, our eternal promise",
        emoji: "🤩🤩🤩🔥🔥🔥✨✨✨❤❤❤",
        color: "from-orange-500 to-red-500",
        gradient: "from-orange-500/20 to-red-500/20",
      },
    ],
    []
  );

  // Respect user's reduced motion preference for accessibility and perf
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: (i) =>
      shouldReduceMotion
        ? { opacity: 1, x: 0 }
        : { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1
          className="text-5xl md:text-7xl font-bold text-white mb-6"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          About Us
        </h1>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Heart className="text-red-400 animate-pulse" size={24} />
          <span className="text-2xl text-white/90 font-medium">
            Our Love Story
          </span>
          <Heart className="text-red-400 animate-pulse" size={24} />
        </div>
      </motion.div>

      {/* Love Introduction */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-pink-400/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5"></div>
        <div className="relative z-10 text-center">
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
        <div className="absolute top-4 right-4">
          <Sparkles className="text-pink-400 animate-pulse" size={32} />
        </div>
      </motion.div>

      {/* Timeline Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          CHAPTERS of Our LIFE
        </h2>
        <p className="text-white/70 text-lg">
          Every milestone that brought us closer together
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-pink-500 via-purple-500 to-red-500 rounded-full hidden md:block"></div>

        <div className="space-y-8 md:space-y-12">
          {timelineEvents.map((event, index) => {
            const IconComponent = event.icon;
            return (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={itemVariants}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Content Card */}
                <div className="flex-1 max-w-lg">
                  <div
                    className={`bg-gradient-to-br ${event.gradient} backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 relative overflow-hidden group hover:border-pink-400/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`p-3 bg-gradient-to-r ${event.color} rounded-xl`}
                        >
                          <IconComponent className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-pink-200 transition-colors">
                            {event.title}
                          </h3>
                          {event.subtitle && (
                            <p className="text-sm text-white/70 italic">
                              {event.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="text-pink-400" size={16} />
                        <span className="text-lg font-semibold text-pink-200">
                          {event.date}
                        </span>
                      </div>

                      <p className="text-white/90 mb-4 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="text-2xl">{event.emoji}</div>
                    </div>

                    {/* Floating hearts animation */}
                    <div className="absolute -top-2 -right-2">
                      <Heart
                        className="text-pink-400/30 animate-bounce"
                        size={20}
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline Dot */}
                <div className="hidden md:block relative z-20">
                  <div
                    className={`w-4 h-4 bg-gradient-to-r ${event.color} rounded-full border-4 border-gray-900 hover:scale-150 transition-transform duration-300`}
                  />
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 max-w-lg hidden md:block"></div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="text-center bg-gradient-to-r from-pink-900/20 via-purple-900/20 to-red-900/20 backdrop-blur-md rounded-3xl p-8 border border-pink-400/20"
      >
        <Heart className="text-red-400 mx-auto mb-4 animate-pulse" size={48} />
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Forever & Always
        </h3>
        <p className="text-white/90 text-lg max-w-2xl mx-auto">
          This is just the beginning of our beautiful journey together. Every
          day we write new chapters filled with love, laughter, and endless
          happiness. Here's to our forever! ❤️✨
        </p>
      </motion.div>
    </div>
  );
};

export default React.memo(AboutPage);
