import React from "react";
import { motion } from "framer-motion";
import {
  Code,
  Smartphone,
  Palette,
  Zap,
  Shield,
  Headphones,
} from "lucide-react";

const ServicesPage = () => {
  const services = [
    {
      icon: Code,
      title: "Web Development",
      description:
        "Custom web applications built with modern technologies and best practices.",
      features: [
        "React & Next.js",
        "Node.js Backend",
        "Database Design",
        "API Development",
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Palette,
      title: "UI/UX Design",
      description:
        "Beautiful and intuitive user interfaces that enhance user experience.",
      features: [
        "User Research",
        "Wireframing",
        "Prototyping",
        "Visual Design",
      ],
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Smartphone,
      title: "Mobile Apps",
      description:
        "Native and cross-platform mobile applications for iOS and Android.",
      features: [
        "React Native",
        "Flutter",
        "iOS Development",
        "Android Development",
      ],
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      description:
        "Speed up your website and improve user engagement with our optimization services.",
      features: [
        "Core Web Vitals",
        "Bundle Analysis",
        "CDN Setup",
        "Caching Strategies",
      ],
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Shield,
      title: "Security Audits",
      description:
        "Comprehensive security assessments to protect your digital assets.",
      features: [
        "Vulnerability Testing",
        "Code Review",
        "Security Protocols",
        "Compliance",
      ],
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Headphones,
      title: "Consulting",
      description:
        "Strategic technology consulting to help your business grow and succeed.",
      features: [
        "Architecture Review",
        "Tech Stack Selection",
        "Team Training",
        "Best Practices",
      ],
      color: "from-indigo-500 to-purple-500",
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
          Our Services
        </motion.h1>
        <motion.p
          className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          We offer comprehensive digital solutions to help your business thrive
          in the modern world. From concept to deployment, we've got you
          covered.
        </motion.p>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
            whileHover={{
              y: -10,
              transition: { type: "spring", stiffness: 300, damping: 10 },
            }}
            className="group bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 relative overflow-hidden"
          >
            {/* Animated background gradient */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
              initial={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6 }}
            />

            {/* Icon */}
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl mb-6 relative z-10`}
            >
              <service.icon size={24} className="text-white" />
            </motion.div>

            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
                {service.title}
              </h3>
              <p className="text-white/80 leading-relaxed mb-6">
                {service.description}
              </p>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                  What's Included:
                </h4>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.8 + index * 0.1 + featureIndex * 0.1,
                      }}
                      className="flex items-center space-x-3 text-white/70"
                    >
                      <motion.div
                        className={`w-2 h-2 bg-gradient-to-r ${service.color} rounded-full`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: featureIndex * 0.2,
                        }}
                      />
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`mt-8 w-full py-3 bg-gradient-to-r ${service.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 opacity-90 hover:opacity-100`}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Process Section */}
      <motion.div
        className="bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Our Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Discovery",
              desc: "We understand your needs and goals",
            },
            {
              step: "02",
              title: "Planning",
              desc: "We create a detailed project roadmap",
            },
            {
              step: "03",
              title: "Development",
              desc: "We build your solution with precision",
            },
            {
              step: "04",
              title: "Launch",
              desc: "We deploy and provide ongoing support",
            },
          ].map((process, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + index * 0.2, duration: 0.6 }}
              className="text-center relative"
            >
              {/* Connection line */}
              {index < 3 && (
                <motion.div
                  className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 2 + index * 0.3, duration: 0.8 }}
                />
              )}

              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg relative z-10"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {process.step}
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {process.title}
              </h3>
              <p className="text-white/70 text-sm">{process.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ServicesPage;
