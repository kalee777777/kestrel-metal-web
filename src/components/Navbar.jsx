import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, Building2, LayoutGrid, Grid3X3, Cable } from 'lucide-react';
import kestrelLogo from '../assets/kestrelmetal.png';
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
          href="/index.html"
          className="logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img src={kestrelLogo} alt="Kestrel Metal" className="logo-image" />
          <div className="logo-text-group">
            <span className="logo-text">KESTREL</span>
            <span className="logo-subtext">METAL</span>
          </div>
        </motion.a>

        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <motion.a
            href="/index.html"
            className="nav-link"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => handleNavClick('/index.html')}
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
            <a href="/products.html" className="nav-link nav-link-toggle">
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
                      <a href="/products.html">Fence Products</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="/products.html">3D Wire Panel Fence</a></li>
                      <li><a href="/products.html">Chain Link Fence</a></li>
                      <li><a href="/products.html">Security Fence</a></li>
                      <li><a href="/products.html">Farm Fence</a></li>
                      <li><a href="/products.html">Fence Posts</a></li>
                      <li><a href="/products.html">Accessories</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <LayoutGrid size={16} />
                      <a href="/products.html">Woven Wire Mesh</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="/products.html">Hexagonal Wire Netting</a></li>
                      <li><a href="/products.html">Stainless Screen Mesh</a></li>
                      <li><a href="/products.html">Woven Gabion Mesh</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Grid3X3 size={16} />
                      <a href="/products.html">Welded Wire Mesh</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="/products.html">Welded Wire Mesh Roll</a></li>
                      <li><a href="/products.html">Welded Wire Mesh Panel</a></li>
                      <li><a href="/products.html">Welded Gabion Box</a></li>
                    </ul>
                  </div>
                  <div className="mega-menu-col">
                    <div className="mega-menu-col-title">
                      <Cable size={16} />
                      <a href="/products.html">Wire Products</a>
                    </div>
                    <ul className="mega-menu-links">
                      <li><a href="/products.html">Barbed Wire</a></li>
                      <li><a href="/products.html">Razor Wire</a></li>
                    </ul>
                  </div>
                </div>
                <div className="mega-menu-footer">
                  <a href="/products.html">View All Products →</a>
                  <a href="/contact.html">Get a Quote →</a>
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
            <a href="/resources.html" className="nav-link nav-link-toggle">
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
                <a href="/downloads.html">Technical Downloads</a>
                <a href="/case-studies.html">Project Cases</a>
                <a href="/blog.html">Company News</a>
                <a href="/knowledge.html">Technical Papers</a>
                <a href="/catalogs.html">Product Catalogs</a>
                <a href="/contact.html">FAQ</a>
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
            <a href="/services.html" className="nav-link nav-link-toggle">
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
                <a href="/services.html">Fabrication Services</a>
                <a href="/services.html">Metal Finishing</a>
                <a href="/custom.html">Custom Solutions</a>
                <a href="/services.html">Designer Services</a>
                <a href="/services.html">Takeoffs &amp; Drawings</a>
                <a href="/services.html">Packaging &amp; Logistics</a>
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
            <a href="/industries.html" className="nav-link nav-link-toggle">
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
                <a href="/industries.html">Construction</a>
                <a href="/industries.html">Agriculture</a>
                <a href="/industries.html">Mining &amp; Quarry</a>
                <a href="/industries.html">Oil &amp; Gas</a>
                <a href="/industries.html">Infrastructure</a>
                <a href="/industries.html">Energy &amp; Power</a>
                <a href="/industries.html">Residential</a>
                <a href="/industries.html">Aquaculture</a>
              </motion.div>
            )}
          </motion.div>

          <motion.a
            href="/about.html"
            className="nav-link"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => handleNavClick('/about.html')}
          >
            About Us
          </motion.a>

          <motion.a
            href="/contact.html"
            className="cta-button"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(255, 107, 53, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Get Quote
          </motion.a>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <a href="/index.html" onClick={() => handleNavClick('/index.html')}>Home</a>

        <div className="mobile-submenu-header" onClick={() => setMobileProductsOpen(!mobileProductsOpen)}>
          Products
          <ChevronDown size={16} className={mobileProductsOpen ? 'rotated' : ''} />
        </div>
        {mobileProductsOpen && (
          <div className="mobile-submenu">
            <a href="/products.html" style={{ paddingLeft: '1.5rem' }}>Fence Products</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>3D Wire Panel Fence</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Chain Link Fence</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Security Fence</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Farm Fence</a>
            <a href="/products.html" style={{ paddingLeft: '1.5rem' }}>Woven Wire Mesh</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Hexagonal Wire Netting</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Stainless Screen Mesh</a>
            <a href="/products.html" style={{ paddingLeft: '1.5rem' }}>Welded Wire Mesh</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Welded Wire Mesh Roll</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Welded Wire Mesh Panel</a>
            <a href="/products.html" style={{ paddingLeft: '1.5rem' }}>Wire Products</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Barbed Wire</a>
            <a href="/products.html" style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>Razor Wire</a>
          </div>
        )}

        <a href="/resources.html" onClick={() => handleNavClick('/resources.html')}>Resources</a>
        <a href="/services.html" onClick={() => handleNavClick('/services.html')}>Services</a>
        <a href="/industries.html" onClick={() => handleNavClick('/industries.html')}>Industries</a>
        <a href="/about.html" onClick={() => handleNavClick('/about.html')}>About Us</a>
        <a href="/contact.html" className="mobile-cta" onClick={() => handleNavClick('/contact.html')}>Get Quote</a>
      </div>
    </motion.nav>
  );
};

export default Navbar;
