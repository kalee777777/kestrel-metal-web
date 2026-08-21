import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const projects = [
    'Security Fencing Solutions',
    'Chain Link & Perimeter Systems',
    'Agricultural & Farm Fencing',
    'Industrial Wire Mesh Products'
  ];

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <motion.div
          className="hero-main"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.div
            className="hero-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="hero-badge">METAL PRODUCTS MANUFACTURER</span>
            <h1 className="hero-title">
              SECURITY FENCING<br/>
              <span className="highlight">&amp; PERIMETER SOLUTIONS</span>
            </h1>

            <p className="hero-subtitle">
              Complete range of fencing solutions including 3D panels, chain link, airport fence,
              horse fence, farm fence and more for security, construction & agriculture.
            </p>
          </motion.div>

          <motion.div
            className="hero-right"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button className="btn-primary">
              EXPLORE PRODUCTS
              <ChevronRight size={18} />
            </button>

            <button className="btn-secondary">
              GET A QUOTE
              <ChevronRight size={16} />
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-projects"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {projects.map((project, index) => (
            <motion.span
              key={index}
              className="project-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
            >
              • {project}
            </motion.span>
          ))}
          <motion.span
            className="project-more"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            + 30+ Countries
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
