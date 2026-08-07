import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProjectManagement from './components/ProjectManagement';
import ProjectsShowcase from './components/ProjectsShowcase';
import Solutions from './components/Solutions';
import Products from './components/Products';
import Evidence from './components/Evidence';
import Consumables from './components/Consumables';
import Footer from './components/Footer';
import DemoMap from './components/DemoMap';

function App() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="app">
      <Navbar />
      
      {/* Floating Demo Button */}
      <motion.button
        className="demo-fab"
        onClick={() => setShowDemo(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        🗺️ View Professional Map Demo
      </motion.button>

      <main>
        <Hero />
        <ProjectManagement />
        <ProjectsShowcase />
        <Solutions />
        <Products />
        <Evidence />
        <Consumables />
      </main>
      <Footer />

      {/* Demo Map Overlay */}
      <AnimatePresence>
        {showDemo && (
          <DemoMap onClose={() => setShowDemo(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
