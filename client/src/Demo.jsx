import React, { useState } from 'react';

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState('all');

  const projects = [
    {
      id: 1,
      title: "AI-Powered FinTech Platform",
      category: "fintech",
      description: "Revolutionary financial technology platform leveraging artificial intelligence to provide personalized investment strategies and automated portfolio management.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      technologies: ["AI/ML", "React", "Node.js", "Python"],
      status: "Live",
      link: "#",
      github: "#"
    },
    {
      id: 2,
      title: "Enterprise AI Assistant",
      category: "ai",
      description: "Intelligent conversational AI assistant designed for enterprise workflows, helping teams automate repetitive tasks and enhance productivity.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=300&fit=crop",
      technologies: ["NLP", "Vue.js", "FastAPI", "TensorFlow"],
      status: "Beta",
      link: "#",
      github: "#"
    },
    {
      id: 3,
      title: "Blockchain Supply Chain",
      category: "blockchain",
      description: "Decentralized supply chain management system using blockchain technology to ensure transparency and traceability across global logistics networks.",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&h=300&fit=crop",
      technologies: ["Blockchain", "Solidity", "React", "Web3"],
      status: "Development",
      link: "#",
      github: "#"
    },
    {
      id: 4,
      title: "IoT Smart City Platform",
      category: "iot",
      description: "Comprehensive IoT platform for smart city management, integrating sensors, data analytics, and real-time monitoring for urban infrastructure optimization.",
      image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=500&h=300&fit=crop",
      technologies: ["IoT", "Angular", "Python", "MongoDB"],
      status: "Live",
      link: "#",
      github: "#"
    },
    {
      id: 5,
      title: "HealthTech Diagnostic Tool",
      category: "healthtech",
      description: "AI-driven diagnostic tool for early disease detection using computer vision and machine learning algorithms to analyze medical imaging data.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500&h=300&fit=crop",
      technologies: ["Computer Vision", "Python", "TensorFlow", "React"],
      status: "Live",
      link: "#",
      github: "#"
    },
    {
      id: 6,
      title: "EdTech Learning Platform",
      category: "edtech",
      description: "Personalized learning platform using AI to adapt content delivery based on individual learning patterns and performance analytics.",
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500&h=300&fit=crop",
      technologies: ["AI/ML", "React", "Node.js", "PostgreSQL"],
      status: "Beta",
      link: "#",
      github: "#"
    }
  ];

  const categories = [
    { id: 'all', label: 'All Projects' },
    { id: 'ai', label: 'AI & ML' },
    { id: 'fintech', label: 'FinTech' },
    { id: 'blockchain', label: 'Blockchain' },
    { id: 'iot', label: 'IoT' },
    { id: 'healthtech', label: 'HealthTech' },
    { id: 'edtech', label: 'EdTech' }
  ];

  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Live': return 'bg-green-500';
      case 'Beta': return 'bg-yellow-500';
      case 'Development': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <section className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Our Portfolio
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-purple-400 mx-auto mb-6"></div>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            Showcasing innovative ventures we've built, funded, and scaled across various industries. 
            Each project represents our commitment to co-creating the future with exceptional founders.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveFilter(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeFilter === category.id
                  ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <div
              key={project.id}
              className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl border border-white/10"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Project Image */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
                  {project.status}
                </div>
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">
                  {project.title}
                </h3>
                <p className="text-purple-100 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/10 text-purple-200 text-xs rounded-full font-medium backdrop-blur-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <a
                    href={project.link}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium text-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg"
                  >
                    View Project
                  </a>
                  <a
                    href={project.github}
                    className="flex-1 bg-white/10 text-white py-2 px-4 rounded-lg font-medium text-center hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Build the Next Big Thing?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Join forces with Mirai Ventures and let's co-create innovative solutions that shape the future. 
              We're always looking for exceptional founders and groundbreaking ideas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/partner_form"
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
              >
                Partner with Us
              </a>
              <a
                href="https://engage.mirai.ventures/"
                className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>

        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
      </div>
    </section>
  );
}