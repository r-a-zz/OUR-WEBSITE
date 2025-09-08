import React from "react";
import { motion } from "framer-motion";
import { Users, Target, Award, Globe } from "lucide-react";

const AboutPage = () => {
  const values = [
    {
      icon: Target,
      title: "Mission Driven",
      desc: "We're committed to pushing the boundaries of digital innovation",
    },
    {
      icon: Users,
      title: "Team First",
      desc: "Our diverse team brings unique perspectives and expertise",
    },
    {
      icon: Award,
      title: "Excellence",
      desc: "We maintain the highest standards in everything we create",
    },
    {
      icon: Globe,
      title: "Global Impact",
      desc: "Creating solutions that make a difference worldwide",
    },
  ];

  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "Lead Developer",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    },
    {
      name: "Sarah Chen",
      role: "UI/UX Designer",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
    },
    {
      name: "Mike Rodriguez",
      role: "Backend Engineer",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    },
    {
      name: "Emily Watson",
      role: "Product Manager",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-white mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          About Our Journey
        </motion.h1>
        <motion.p
          className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          We're a passionate team of innovators, designers, and developers
          united by our love for creating exceptional digital experiences that
          inspire and empower.
        </motion.p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              Our Story
            </motion.h2>
            <motion.p
              className="text-lg text-white/90 leading-relaxed"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              Founded in 2020, we began as a small group of creative minds who
              believed that technology should be beautiful, accessible, and
              meaningful. What started as a passion project has grown into a
              full-service digital agency.
            </motion.p>
            <motion.p
              className="text-lg text-white/90 leading-relaxed"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              Today, we work with clients ranging from innovative startups to
              established enterprises, helping them transform their digital
              presence and achieve their goals through cutting-edge technology
              and thoughtful design.
            </motion.p>
          </div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <div className="aspect-square bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-2 border-white/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 border border-white/30 rounded-full"
              />
              <div className="text-white/60 text-center">
                <div className="text-6xl font-bold">5+</div>
                <div className="text-lg">Years of Innovation</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Values Section */}
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Our Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 + index * 0.2, duration: 0.6 }}
              whileHover={{
                y: -10,
                transition: { type: "spring", stiffness: 300, damping: 10 },
              }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
              >
                <value.icon size={24} className="text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
                {value.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {value.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Team Section */}
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 0.8 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Meet Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.6 + index * 0.2, duration: 0.6 }}
              whileHover={{
                y: -10,
                transition: { type: "spring", stiffness: 300, damping: 10 },
              }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center group"
            >
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-400 to-purple-400"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                {member.name}
              </h3>
              <p className="text-white/70 text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AboutPage;
