import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import './VideoBanner.css';

const VideoBanner = () => {
  return (
    <section className="video-banner">
      <div className="video-banner-bg"></div>
      <div className="video-banner-overlay"></div>
      <div className="video-banner-content">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="video-banner-text"
        >
          <h2 className="video-banner-title">Your professional solution provider</h2>
          <p className="video-banner-subtitle">
            Partner with us and benefit from our unparalleled expertise
            <br />
            and commitment to excellence
          </p>
        </motion.div>
        <motion.button
          className="video-play-btn"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="play-icon-circle">
            <Play size={18} fill="white" strokeWidth={0} />
          </span>
          <span className="play-text">Play the video</span>
        </motion.button>
      </div>
    </section>
  );
};

export default VideoBanner;
