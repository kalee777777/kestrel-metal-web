import { lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import GlobalMapSection from './components/DemoMap';
import ProjectManagement from './components/ProjectManagement';
import ProjectsShowcase from './components/ProjectsShowcase';
import Solutions from './components/Solutions';
import Products from './components/Products';
import Evidence from './components/Evidence';
import Consumables from './components/Consumables';
import Footer from './components/Footer';

function App() {
  return (
    <div className="app">
      <Navbar />

      <main>
        <Hero />
        <Suspense fallback={<div className="global-map-loading">Loading global map...</div>}>
          <GlobalMapSection />
        </Suspense>
        <ProjectManagement />
        <ProjectsShowcase />
        <Solutions />
        <Products />
        <Evidence />
        <Consumables />
      </main>
      <Footer />
    </div>
  );
}

export default App;
