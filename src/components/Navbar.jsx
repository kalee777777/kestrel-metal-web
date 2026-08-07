import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, Building2, Cpu, Wrench, Factory, FileText, GraduationCap, FlaskConical, Briefcase } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setIsMobileMenuOpen(false);
    setMobileProductsOpen(false);
  };

  return (
    <motion.nav
      className={`navbar ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="navbar-container">
        <motion.a
          href="#home"
          className="logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="logo-text">KESTREL</span>
          <span className="logo-subtext">METAL</span>
        </motion.a>

        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <motion.a
            href="#home"
            className="nav-link"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => handleNavClick('#home')}
          >
            Home
          </motion.a>

          <motion.div
            className="nav-item-wrapper"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onMouseEnter={() => setActiveMegaMenu('products')}
            onMouseLeave={() => setActiveMegaMenu(null)}
          >
            <a href="#products" className="nav-link nav-link-toggle">
              Products
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeMegaMenu === 'products' && (
              <motion.div className="mega-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="mega-menu-inner">
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Building2 size={16} />
                      <a href="#products">Anode Plates</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">Pb-Sn Anode Plate</a></li>
                      <li><a href="#products">Pb-Ca-Sn Anode Plate</a></li>
                      <li><a href="#products">Lead Alloy Anode</a></li>
                      <li><a href="#products">Custom Anode Plates</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Cpu size={16} />
                      <a href="#products">Cathode Plates</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">Stainless Steel Cathode</a></li>
                      <li><a href="#products">Titanium Cathode</a></li>
                      <li><a href="#products">Copper Cathode</a></li>
                      <li><a href="#products">Custom Cathode</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Factory size={16} />
                      <a href="#products">Electrolysis Systems</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">Copper Electrowinning</a></li>
                      <li><a href="#products">Zinc Electrowinning</a></li>
                      <li><a href="#products">Nickel Electrowinning</a></li>
                      <li><a href="#products">Custom Systems</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Wrench size={16} />
                      <a href="#products">Automation Equipment</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">Automatic Stripping</a></li>
                      <li><a href="#products">Cathode Handling</a></li>
                      <li><a href="#products">Anode Washing</a></li>
                      <li><a href="#products">Control Systems</a></li>
                    </ul>
                  </div>
                </div>
                <div className="mega-menu-footer">
                  <a href="#products">View All Products →</a>
                  <a href="#contact">Get a Quote →</a>
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="nav-item-wrapper"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onMouseEnter={() => setActiveDropdown('resources')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <a href="#solutions" className="nav-link nav-link-toggle">
              Resources
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeDropdown === 'resources' && (
              <motion.div className="dropdown-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <a href="#solutions">Technical Downloads</a>
                <a href="#projects">Project Cases</a>
                <a href="#about">Company News</a>
                <a href="#solutions">Technical Papers</a>
                <a href="#consumables">Product Catalogs</a>
                <a href="#contact">FAQ</a>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="nav-item-wrapper"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onMouseEnter={() => setActiveDropdown('services')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <a href="#solutions" className="nav-link nav-link-toggle">
              Services
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeDropdown === 'services' && (
              <motion.div className="dropdown-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <a href="#solutions">R&D Services</a>
                <a href="#solutions">Engineering Design</a>
                <a href="#solutions">Procurement</a>
                <a href="#solutions">Installation & Commissioning</a>
                <a href="#solutions">Operations Support</a>
                <a href="#solutions">Training</a>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="nav-item-wrapper"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onMouseEnter={() => setActiveDropdown('industries')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <a href="#solutions" className="nav-link nav-link-toggle">
              Industries
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeDropdown === 'industries' && (
              <motion.div className="dropdown-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <a href="#solutions">Copper Mining</a>
                <a href="#solutions">Zinc Mining</a>
                <a href="#solutions">Nickel Mining</a>
                <a href="#solutions">Gold & Silver</a>
                <a href="#solutions">Lead Processing</a>
                <a href="#solutions">Rare Earth</a>
              </motion.div>
            )}
          </motion.div>

          <motion.a
            href="#about"
            className="nav-link"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => handleNavClick('#about')}
          >
            About Us
          </motion.a>

          <motion.button
            className="cta-button"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(255, 107, 53, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Get Quote
          </motion.button>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <a href="#home" onClick={() => handleNavClick('#home')}>Home</a>
        
        <div className="mobile-submenu-header" onClick={() => setMobileProductsOpen(!mobileProductsOpen)}>
          Products
          <ChevronDown size={16} className={mobileProductsOpen ? 'rotated' : ''} />
        </div>
        {mobileProductsOpen && (
          <div className="mobile-submenu">
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Anode Plates</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Pb-Sn Anode Plate</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Pb-Ca-Sn Anode Plate</a>
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Cathode Plates</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Stainless Steel Cathode</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Titanium Cathode</a>
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Electrolysis Systems</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Copper Electrowinning</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Zinc Electrowinning</a>
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Automation Equipment</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Automatic Stripping</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Control Systems</a>
          </div>
        )}
        
        <a href="#solutions" onClick={() => handleNavClick('#solutions')}>Resources</a>
        <a href="#solutions" onClick={() => handleNavClick('#solutions')}>Services</a>
        <a href="#solutions" onClick={() => handleNavClick('#solutions')}>Industries</a>
        <a href="#about" onClick={() => handleNavClick('#about')}>About Us</a>
        <a href="#contact" className="mobile-cta" onClick={() => handleNavClick('#contact')}>Get Quote</a>
      </div>
    </motion.nav>
  );
};

export default Navbar;
