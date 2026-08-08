import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import kestrelLogo from '../assets/kestrelmetal.png';
import './Footer.css';

const Footer = () => {
  return (
    <footer id="contact" className="footer">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            <motion.div
              className="footer-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h4 className="footer-col-title">Kestrel Metal</h4>
              <ul className="footer-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#solutions">Industries</a></li>
                <li><a href="#solutions">Services</a></li>
                <li><a href="#projects">Case Studies</a></li>
              </ul>
            </motion.div>

            <motion.div
              className="footer-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="footer-col-title">Products</h4>
              <ul className="footer-links">
                <li><a href="#products">Fence Products</a></li>
                <li><a href="#products">Woven Wire Mesh</a></li>
                <li><a href="#products">Welded Wire Mesh</a></li>
                <li><a href="#products">Wire Products</a></li>
                <li><a href="#products">All Products</a></li>
              </ul>
            </motion.div>

            <motion.div
              className="footer-brand-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <a href="#home" className="footer-logo">
                <img src={kestrelLogo} alt="Kestrel Metal" className="footer-logo-image" />
                <div className="footer-logo-text">
                  <span className="logo-text">KESTREL</span>
                  <span className="logo-subtext">METAL</span>
                </div>
              </a>
              <span className="footer-tagline">Professional Metal Products Manufacturer</span>
              <div className="footer-stats">
                <div className="stat-item">
                  <span className="stat-value">20+</span>
                  <span className="stat-unit">Years</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">50+</span>
                  <span className="stat-unit">Countries</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="footer-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="footer-col-title">Support</h4>
              <ul className="footer-links">
                <li><a href="#solutions">Custom Solutions</a></li>
                <li><a href="#solutions">Technical Support</a></li>
                <li><a href="#consumables">Product Catalogs</a></li>
                <li><a href="#solutions">Technical Downloads</a></li>
                <li><a href="#contact">Request a Quote</a></li>
              </ul>
            </motion.div>

            <motion.div
              className="footer-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <h4 className="footer-col-title">Resources</h4>
              <ul className="footer-links">
                <li><a href="#about">Company News</a></li>
                <li><a href="#projects">Case Studies</a></li>
                <li><a href="#consumables">Catalogs</a></li>
                <li><a href="#solutions">Technical Papers</a></li>
                <li><a href="#solutions">Services</a></li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-inner">
            <span className="copyright">© 2024 Kestrel Metal Products Co., Ltd. All Rights Reserved.</span>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#000"/>
                </svg>
              </a>
            </div>
            <div className="footer-bottom-links">
              <a href="#">Privacy Policy</a>
              <span className="separator">·</span>
              <a href="#">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
