import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  const stats = [
    { number: '20+', label: 'Years of Experience' },
    { number: '50+', label: 'Countries Served' },
    { number: '1000+', label: 'Successful Projects' },
    { number: '60+', label: 'Technical Experts' }
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
            FORGING THE FUTURE
            <br />
            <span className="highlight">OF METAL</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            We are committed to providing innovative solutions for the global metallurgy industry,
            <br />
            shaping the future of metal industry with excellent technology and reliable quality
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
              Explore Products
              <ChevronRight size={20} />
            </motion.button>

            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={18} />
              Watch Video
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
            >
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
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
