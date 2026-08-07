import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const footerLinks = {
    products: [
      { name: 'Anode Plates', href: '#' },
      { name: 'Cathode Plates', href: '#' },
      { name: 'Electrolysis Systems', href: '#' },
      { name: 'Automation Equipment', href: '#' }
    ],
    solutions: [
      { name: 'R&D Services', href: '#' },
      { name: 'Engineering', href: '#' },
      { name: 'Procurement', href: '#' },
      { name: 'Operations Support', href: '#' }
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'News & Updates', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#contact' }
    ]
  };

  return (
    <footer id="contact" className="footer">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            <motion.div
              className="footer-brand"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <a href="#home" className="footer-logo">
                <span className="logo-text">KESTREL</span>
                <span className="logo-subtext">METAL</span>
              </a>
              <p className="brand-description">
                Committed to providing innovative solutions for the global metallurgy industry,
                shaping the future of metal industry with excellent technology and reliable quality.
              </p>
              <div className="contact-info">
                <a href="mailto:info@kestrel-metal.com" className="contact-item">
                  <Mail size={18} />
                  info@kestrel-metal.com
                </a>
                <a href="tel:+8612345678900" className="contact-item">
                  <Phone size={18} />
                  +86 123 4567 8900
                </a>
                <div className="contact-item">
                  <MapPin size={18} />
                  Zhangjiang Hi-Tech Park, Pudong, Shanghai, China
                </div>
              </div>
            </motion.div>

            <motion.div
              className="footer-links-group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="links-title">Products</h3>
              <ul className="links-list">
                {footerLinks.products.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>
                      {link.name}
                      <ArrowUpRight size={14} className="arrow-icon" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="footer-links-group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="links-title">Solutions</h3>
              <ul className="links-list">
                {footerLinks.solutions.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>
                      {link.name}
                      <ArrowUpRight size={14} className="arrow-icon" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="footer-links-group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="links-title">Company</h3>
              <ul className="links-list">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>
                      {link.name}
                      <ArrowUpRight size={14} className="arrow-icon" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <div className="bottom-content">
            <p className="copyright">
              © 2024 Kestrel Metal. All rights reserved.
            </p>
            <div className="bottom-links">
              <a href="#">Privacy Policy</a>
              <span className="separator">|</span>
              <a href="#">Terms of Service</a>
              <span className="separator">|</span>
              <a href="#">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
