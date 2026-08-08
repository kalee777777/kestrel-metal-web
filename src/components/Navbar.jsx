import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, Building2, LayoutGrid, Grid3X3, Cable, FileText, BookOpen, Briefcase, HardHat } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navbarRef = useRef(null);
  const closeTimer = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [megaMenuTop, setMegaMenuTop] = useState(72);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeMegaMenu === 'products' && navbarRef.current) {
      const rect = navbarRef.current.getBoundingClientRect();
      setMegaMenuTop(rect.bottom + 8);
    }
  }, [activeMegaMenu, isScrolled]);

  const handleNavClick = (href) => {
    setIsMobileMenuOpen(false);
    setMobileProductsOpen(false);
  };

  const openMegaMenu = (menu) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveMegaMenu(menu);
  };

  const closeMegaMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => {
      setActiveMegaMenu(null);
      closeTimer.current = null;
    }, 200);
  };

  const openDropdown = (menu) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDropdown(menu);
  };

  const closeDropdown = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null);
      closeTimer.current = null;
    }, 200);
  };

  return (
    <motion.nav
      ref={navbarRef}
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
            onMouseEnter={() => openMegaMenu('products')}
            onMouseLeave={closeMegaMenu}
          >
            <a href="#products" className="nav-link nav-link-toggle">
              Products
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeMegaMenu === 'products' && (
              <motion.div
                className="mega-menu"
                style={{ '--mega-menu-top': `${megaMenuTop}px` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => openMegaMenu('products')}
                onMouseLeave={closeMegaMenu}
              >
                <div className="mega-menu-inner">
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Building2 size={16} />
                      <a href="#products">Fence Products</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">3D Wire Panel Fence</a></li>
                      <li><a href="#products">Chain Link Fence</a></li>
                      <li><a href="#products">Security Fence</a></li>
                      <li><a href="#products">Farm Fence</a></li>
                      <li><a href="#products">Fence Posts</a></li>
                      <li><a href="#products">Accessories</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <LayoutGrid size={16} />
                      <a href="#products">Woven Wire Mesh</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">Hexagonal Wire Netting</a></li>
                      <li><a href="#products">Stainless Screen Mesh</a></li>
                      <li><a href="#products">Woven Gabion Mesh</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Grid3X3 size={16} />
                      <a href="#products">Welded Wire Mesh</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">Welded Wire Mesh Roll</a></li>
                      <li><a href="#products">Welded Wire Mesh Panel</a></li>
                      <li><a href="#products">Welded Gabion Box</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Cable size={16} />
                      <a href="#products">Wire Products</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="#products">Barbed Wire</a></li>
                      <li><a href="#products">Razor Wire</a></li>
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
            onMouseEnter={() => openDropdown('resources')}
            onMouseLeave={closeDropdown}
          >
            <a href="#solutions" className="nav-link nav-link-toggle">
              Resources
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeDropdown === 'resources' && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => openDropdown('resources')}
                onMouseLeave={closeDropdown}
              >
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
            onMouseEnter={() => openDropdown('services')}
            onMouseLeave={closeDropdown}
          >
            <a href="#solutions" className="nav-link nav-link-toggle">
              Services
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeDropdown === 'services' && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => openDropdown('services')}
                onMouseLeave={closeDropdown}
              >
                <a href="#solutions">Fabrication Services</a>
                <a href="#solutions">Metal Finishing</a>
                <a href="#solutions">Custom Solutions</a>
                <a href="#solutions">Designer Services</a>
                <a href="#solutions">Takeoffs & Drawings</a>
                <a href="#solutions">Packaging & Logistics</a>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="nav-item-wrapper"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onMouseEnter={() => openDropdown('industries')}
            onMouseLeave={closeDropdown}
          >
            <a href="#solutions" className="nav-link nav-link-toggle">
              Industries
              <ChevronDown size={14} className="chevron-icon" />
            </a>
            {activeDropdown === 'industries' && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => openDropdown('industries')}
                onMouseLeave={closeDropdown}
              >
                <a href="#solutions">Construction</a>
                <a href="#solutions">Agriculture</a>
                <a href="#solutions">Mining & Quarry</a>
                <a href="#solutions">Oil & Gas</a>
                <a href="#solutions">Infrastructure</a>
                <a href="#solutions">Energy & Power</a>
                <a href="#solutions">Residential</a>
                <a href="#solutions">Aquaculture</a>
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
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Fence Products</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>3D Wire Panel Fence</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Chain Link Fence</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Security Fence</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Farm Fence</a>
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Woven Wire Mesh</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Hexagonal Wire Netting</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Stainless Screen Mesh</a>
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Welded Wire Mesh</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Welded Wire Mesh Roll</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Welded Wire Mesh Panel</a>
            <a href="#products" style={{ paddingLeft: '1.5rem' }}>Wire Products</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Barbed Wire</a>
            <a href="#products" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Razor Wire</a>
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
