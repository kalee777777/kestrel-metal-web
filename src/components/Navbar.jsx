import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { 
      name: 'Global Presence', 
      href: '#global',
      children: [
        { name: 'Worldwide Map', href: '#global' },
        { name: 'Project Network', href: '#global' },
      ]
    },
    { 
      name: 'Solutions', 
      href: '#solutions',
      children: [
        { name: 'Project Management', href: '#management' },
        { name: 'Metallurgical Solutions', href: '#solutions' },
      ]
    },
    { 
      name: 'Products', 
      href: '#products',
      children: [
        { name: 'Core Products', href: '#products' },
        { name: 'Professional Consumables', href: '#consumables' },
      ]
    },
    { name: 'Projects', href: '#projects' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' }
  ];

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
          {navItems.map((item, index) => (
            <div 
              key={item.name} 
              className="nav-item-wrapper"
              onMouseEnter={() => item.children && setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <motion.a
                href={item.href}
                className="nav-link"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
                {item.children && <ChevronDown size={14} className="chevron-icon" />}
              </motion.a>
              
              {item.children && activeDropdown === item.name && (
                <motion.div 
                  className="dropdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.children.map((child) => (
                    <a 
                      key={child.name} 
                      href={child.href}
                      className="dropdown-link"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {child.name}
                    </a>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
          <motion.button
            className="cta-button"
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(255, 107, 53, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            Get a Quote
          </motion.button>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
