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
            <h1 className="hero-title">
              LET'S MAKE SOME<br/>
              <span className="highlight">REAL CHANGES</span>
            </h1>

            <p className="hero-subtitle">
              We are committed to understanding and addressing the unique challenges
              and needs of each client, fostering enduring partnerships built on trust,
              dependability, and shared success.
            </p>
          </motion.div>

          <motion.div
            className="hero-right"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button className="btn-primary">
              Read more
              <ChevronRight size={18} />
            </button>

            <button className="btn-secondary">
              Play the video
              <Play size={16} />
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
