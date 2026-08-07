import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const projects = [
    '5,000tpa Copper Recycling From WEEE',
    '240,000tpa Cathode Copper Project',
    '3,000tpa Copper EW Project',
    '6,000tpa Cathode Copper Project'
  ];

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            LET'S MAKE SOME
            <br />
            <span className="highlight">REAL CHANGES</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            We are committed to understanding and addressing the unique challenges
            <br />
            and needs of each client, fostering enduring partnerships built on trust,
            <br />
            dependability, and shared success.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(255, 107, 53, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              Read more
              <ChevronRight size={20} />
            </motion.button>

            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={18} />
              Play the video
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-projects"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="project-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
            >
              <span className="project-bullet">•</span>
              <span className="project-text">{project}</span>
            </motion.div>
          ))}
          <motion.span
            className="project-more"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            + 50+
          </motion.span>
        </motion.div>
      </div>

      <motion.div
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </section>
  );
};

export default Hero;
