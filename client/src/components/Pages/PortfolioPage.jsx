import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, Filter, X } from "lucide-react";

const PortfolioPage = () => {
  const [filter, setFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);

  const categories = ["all", "web", "mobile", "design"];

  const projects = [
    {
      id: 1,
      title: "E-commerce Platform",
      category: "web",
      description: "A modern e-commerce solution with advanced features",
      longDescription:
        "A comprehensive e-commerce platform built with React, Node.js, and PostgreSQL. Features include real-time inventory management, payment processing, admin dashboard, and mobile-responsive design.",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
      technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "Redis"],
      liveUrl: "#",
      githubUrl: "#",
      featured: true,
    },
    {
      id: 2,
      title: "Mobile Banking App",
      category: "mobile",
      description: "Secure and intuitive banking application",
      longDescription:
        "A secure mobile banking application with biometric authentication, real-time transactions, budget tracking, and investment portfolio management. Built with React Native and integrated with banking APIs.",
      image:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
      technologies: [
        "React Native",
        "Node.js",
        "MongoDB",
        "OAuth",
        "Biometrics",
      ],
      liveUrl: "#",
      githubUrl: "#",
      featured: true,
    },
    {
      id: 3,
      title: "Brand Identity Design",
      category: "design",
      description: "Complete brand identity for tech startup",
      longDescription:
        "Comprehensive brand identity design including logo, color palette, typography, business cards, and marketing materials for an innovative tech startup in the AI space.",
      image:
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop",
      technologies: ["Figma", "Illustrator", "InDesign", "Photoshop"],
      liveUrl: "#",
      githubUrl: "#",
      featured: false,
    },
    {
      id: 4,
      title: "Analytics Dashboard",
      category: "web",
      description: "Real-time data visualization platform",
      longDescription:
        "A powerful analytics dashboard for data visualization with real-time charts, customizable widgets, report generation, and team collaboration features. Handles millions of data points efficiently.",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
      technologies: ["Vue.js", "D3.js", "Python", "Docker", "WebSocket"],
      liveUrl: "#",
      githubUrl: "#",
      featured: true,
    },
    {
      id: 5,
      title: "Food Delivery App",
      category: "mobile",
      description: "On-demand food delivery solution",
      longDescription:
        "Full-stack food delivery application with customer app, restaurant dashboard, delivery tracking, payment integration, and real-time order management system.",
      image:
        "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&h=400&fit=crop",
      technologies: [
        "Flutter",
        "Firebase",
        "Google Maps",
        "PayPal",
        "Push Notifications",
      ],
      liveUrl: "#",
      githubUrl: "#",
      featured: false,
    },
    {
      id: 6,
      title: "Portfolio Website",
      category: "design",
      description: "Creative portfolio for digital artist",
      longDescription:
        "An artistic portfolio website featuring smooth animations, interactive galleries, blog integration, and contact forms. Designed to showcase creative work in an engaging way.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
      technologies: ["Next.js", "Framer Motion", "Sanity CMS", "Vercel"],
      liveUrl: "#",
      githubUrl: "#",
      featured: false,
    },
  ];

  const filteredProjects =
    filter === "all"
      ? projects
      : projects.filter((project) => project.category === filter);

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
          Our Portfolio
        </motion.h1>
        <motion.p
          className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Explore our collection of successful projects that showcase our
          expertise in creating innovative digital solutions.
        </motion.p>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        {categories.map((category, index) => (
          <motion.button
            key={category}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(category)}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${
              filter === category
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20"
            }`}
          >
            <Filter size={16} />
            <span className="capitalize">{category}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="wait">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  whileHover={{ scale: 1.1 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Featured Badge */}
                {project.featured && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full"
                  >
                    Featured
                  </motion.div>
                )}

                {/* Overlay Icons */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.liveUrl, "_blank");
                      }}
                    >
                      <ExternalLink size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.githubUrl, "_blank");
                      }}
                    >
                      <Github size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {project.title}
                </h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 3).map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full border border-white/20"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full border border-white/20">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>

              {/* Modal Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                      {selectedProject.title}
                    </h2>
                    <p className="text-white/80 leading-relaxed">
                      {selectedProject.longDescription}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Technologies Used:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-white/20 rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                      onClick={() =>
                        window.open(selectedProject.liveUrl, "_blank")
                      }
                    >
                      <ExternalLink size={18} />
                      <span>Live Demo</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
                      onClick={() =>
                        window.open(selectedProject.githubUrl, "_blank")
                      }
                    >
                      <Github size={18} />
                      <span>Source Code</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioPage;
