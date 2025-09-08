import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  User,
  Tag,
  Search,
  ArrowRight,
  Clock,
  Eye,
} from "lucide-react";

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "technology", "design", "development", "business"];

  const blogPosts = [
    {
      id: 1,
      title: "The Future of Web Development: Trends to Watch in 2024",
      excerpt:
        "Exploring the cutting-edge technologies and methodologies that are shaping the future of web development.",
      content:
        "As we move through 2024, the web development landscape continues to evolve at a rapid pace. From AI-powered development tools to advanced framework features, here are the trends that are defining the future of our industry...",
      author: "Alex Johnson",
      date: "2024-01-15",
      readTime: "8 min read",
      views: "2.4k",
      category: "technology",
      tags: ["Web Development", "AI", "Trends", "Future Tech"],
      image:
        "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop",
      featured: true,
    },
    {
      id: 2,
      title: "Creating Accessible User Interfaces: A Complete Guide",
      excerpt:
        "Learn how to design and develop inclusive interfaces that work for everyone, regardless of their abilities.",
      content:
        "Accessibility in web design isn't just a legal requirement—it's a moral imperative. In this comprehensive guide, we'll explore the principles and practices of creating truly accessible user interfaces...",
      author: "Sarah Chen",
      date: "2024-01-12",
      readTime: "12 min read",
      views: "1.8k",
      category: "design",
      tags: ["Accessibility", "UX Design", "Inclusive Design", "WCAG"],
      image:
        "https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=800&h=400&fit=crop",
      featured: false,
    },
    {
      id: 3,
      title: "Mastering React Performance Optimization",
      excerpt:
        "Deep dive into advanced techniques for optimizing React applications and improving user experience.",
      content:
        "Performance optimization in React applications is crucial for delivering excellent user experiences. This article covers advanced techniques, from memo optimization to bundle splitting...",
      author: "Mike Rodriguez",
      date: "2024-01-10",
      readTime: "15 min read",
      views: "3.1k",
      category: "development",
      tags: ["React", "Performance", "Optimization", "JavaScript"],
      image:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
      featured: true,
    },
    {
      id: 4,
      title: "Building a Successful Design System from Scratch",
      excerpt:
        "A step-by-step guide to creating, implementing, and maintaining a comprehensive design system.",
      content:
        "Design systems are the backbone of consistent, scalable product design. In this guide, we'll walk through the process of building a design system from the ground up...",
      author: "Emily Watson",
      date: "2024-01-08",
      readTime: "10 min read",
      views: "1.5k",
      category: "design",
      tags: ["Design System", "UI/UX", "Branding", "Consistency"],
      image:
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=400&fit=crop",
      featured: false,
    },
    {
      id: 5,
      title: "The Business Impact of Good UX Design",
      excerpt:
        "Understanding how thoughtful user experience design directly impacts business metrics and growth.",
      content:
        "Great UX design isn't just about making things look pretty—it's about driving real business results. Let's explore how UX design decisions impact key business metrics...",
      author: "David Kim",
      date: "2024-01-05",
      readTime: "7 min read",
      views: "2.2k",
      category: "business",
      tags: ["UX Design", "Business", "ROI", "Metrics"],
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
      featured: false,
    },
    {
      id: 6,
      title: "Emerging Technologies in Frontend Development",
      excerpt:
        "Exploring the latest tools and technologies that are revolutionizing frontend development.",
      content:
        "The frontend development ecosystem is constantly evolving. From new JavaScript frameworks to innovative build tools, here's what's on the horizon...",
      author: "Lisa Park",
      date: "2024-01-03",
      readTime: "9 min read",
      views: "1.9k",
      category: "technology",
      tags: ["Frontend", "JavaScript", "Tools", "Innovation"],
      image:
        "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
      featured: false,
    },
  ];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter((post) => post.featured);

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
          Our Blog
        </motion.h1>
        <motion.p
          className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Insights, tutorials, and thoughts on web development, design, and the
          latest industry trends.
        </motion.p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="flex flex-col md:flex-row gap-4 justify-between items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"
            size={20}
          />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all duration-300"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/20"
              }`}
            >
              <span className="capitalize">{category}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Featured Posts */}
      {selectedCategory === "all" && searchTerm === "" && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="space-y-8"
        >
          <h2 className="text-3xl font-bold text-white">Featured Articles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredPosts.slice(0, 2).map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.2, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="group bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Featured
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-4 text-white/60 text-sm">
                    <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 capitalize">
                      {post.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-white/70 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <span className="text-white/80 text-sm">
                        {post.author}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span className="text-sm">Read More</span>
                      <ArrowRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Posts */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="space-y-8"
      >
        <h2 className="text-3xl font-bold text-white">
          {searchTerm
            ? `Search Results (${filteredPosts.length})`
            : "Latest Articles"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -10 }}
              className="group bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {post.featured && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Featured
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-white/60 text-sm">
                  <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 capitalize">
                    {post.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Eye size={14} />
                    <span>{post.views}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-md border border-white/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-2 text-white/60 text-xs">
                    <Calendar size={12} />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <Clock size={12} />
                    <span>{post.readTime}</span>
                  </div>

                  <motion.button
                    whileHover={{ x: 3 }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-white/60 text-lg mb-4">No articles found</div>
            <p className="text-white/40">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default BlogPage;
