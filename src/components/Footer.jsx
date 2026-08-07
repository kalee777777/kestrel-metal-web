import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowUpRight, Factory, Cpu, Wrench, FileText } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const footerLinks = {
    products: [
      { name: 'Anode Plates', href: '#products' },
      { name: 'Cathode Plates', href: '#products' },
      { name: 'Electrolysis Systems', href: '#products' },
      { name: 'Automation Equipment', href: '#products' },
      { name: 'Professional Consumables', href: '#consumables' }
    ],
    solutions: [
      { name: 'Project Management', href: '#management' },
      { name: 'R&D Services', href: '#solutions' },
      { name: 'Engineering', href: '#solutions' },
      { name: 'Procurement', href: '#solutions' },
      { name: 'Operations Support', href: '#solutions' }
    ],
    navigation: [
      { name: 'Global Presence', href: '#global' },
      { name: 'Projects', href: '#projects' },
      { name: 'About Us', href: '#about' },
      { name: 'Contact', href: '#contact' }
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'News & Updates', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#contact' }
    ]
  };

  const stats = [
    { number: '20+', label: 'Years Experience' },
    { number: '50+', label: 'Countries' },
    { number: '100+', label: 'Projects' }
  ];

  return (
    <footer id="contact" className="footer">
      <div className="footer-stats">
        <div className="footer-container">
          <div className="stats-row">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

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
                  <Mail size={16} />
                  info@kestrel-metal.com
                </a>
                <a href="tel:+8612345678900" className="contact-item">
                  <Phone size={16} />
                  +86 123 4567 8900
                </a>
                <div className="contact-item">
                  <MapPin size={16} />
                  Changsha, Hunan, China
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
                      <ArrowUpRight size={12} className="arrow-icon" />
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
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <h3 className="links-title">Solutions</h3>
              <ul className="links-list">
                {footerLinks.solutions.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>
                      {link.name}
                      <ArrowUpRight size={12} className="arrow-icon" />
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
              <h3 className="links-title">Explore</h3>
              <ul className="links-list">
                {footerLinks.navigation.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>
                      {link.name}
                      <ArrowUpRight size={12} className="arrow-icon" />
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
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <h3 className="links-title">Company</h3>
              <ul className="links-list">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>
                      {link.name}
                      <ArrowUpRight size={12} className="arrow-icon" />
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
