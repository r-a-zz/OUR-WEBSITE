import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "hello@ourwebsite.com",
      subContent: "We'll respond within 24 hours",
      link: "mailto:hello@ourwebsite.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "+1 (555) 123-4567",
      subContent: "Mon-Fri 9AM-6PM EST",
      link: "tel:+15551234567",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      content: "123 Design Street",
      subContent: "San Francisco, CA 94110",
      link: "https://maps.google.com",
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
          Get In Touch
        </motion.h1>
        <motion.p
          className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Ready to start your next project? Let's discuss how we can bring your
          vision to life with our expertise and passion.
        </motion.p>
      </motion.div>

      {/* Contact Info Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        {contactInfo.map((info, index) => (
          <motion.a
            key={index}
            href={info.link}
            target={info.link.startsWith("http") ? "_blank" : "_self"}
            rel={info.link.startsWith("http") ? "noopener noreferrer" : ""}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.2, duration: 0.6 }}
            whileHover={{
              y: -10,
              transition: { type: "spring", stiffness: 300, damping: 10 },
            }}
            className="group bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 text-center block"
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6"
            >
              <info.icon size={24} className="text-white" />
            </motion.div>

            <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
              {info.title}
            </h3>
            <p className="text-lg text-white/90 font-medium mb-2">
              {info.content}
            </p>
            <p className="text-white/60 text-sm">{info.subContent}</p>
          </motion.a>
        ))}
      </motion.div>

      {/* Contact Form */}
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20">
          <motion.h2
            className="text-3xl font-bold text-white text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            Send us a Message
          </motion.h2>

          {/* Success/Error Message */}
          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                submitStatus === "success"
                  ? "bg-green-500/20 border border-green-500/30 text-green-300"
                  : "bg-red-500/20 border border-red-500/30 text-red-300"
              }`}
            >
              {submitStatus === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>
                {submitStatus === "success"
                  ? "Thank you! Your message has been sent successfully."
                  : "Oops! Something went wrong. Please try again."}
              </span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8, duration: 0.6 }}
              >
                <label className="block text-white/90 mb-3 font-semibold">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2, duration: 0.6 }}
              >
                <label className="block text-white/90 mb-3 font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all duration-300"
                  placeholder="your.email@example.com"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            >
              <label className="block text-white/90 mb-3 font-semibold">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all duration-300"
                placeholder="What's this about?"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
            >
              <label className="block text-white/90 mb-3 font-semibold">
                Message *
              </label>
              <textarea
                rows="6"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all duration-300 resize-none"
                placeholder="Tell us about your project, goals, and how we can help..."
              ></textarea>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Send Message</span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        className="bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8, duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              question: "What's your typical project timeline?",
              answer:
                "Project timelines vary based on scope and complexity, but most websites take 4-8 weeks from start to finish.",
            },
            {
              question: "Do you provide ongoing support?",
              answer:
                "Yes! We offer maintenance packages and ongoing support to keep your website running smoothly.",
            },
            {
              question: "Can you work with our existing team?",
              answer:
                "Absolutely! We love collaborating with in-house teams and can integrate seamlessly into your workflow.",
            },
            {
              question: "What technologies do you use?",
              answer:
                "We use modern technologies like React, Node.js, and cloud platforms to build scalable, performant solutions.",
            },
          ].map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 + index * 0.2, duration: 0.6 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold text-white">
                {faq.question}
              </h3>
              <p className="text-white/70 leading-relaxed">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ContactPage;
