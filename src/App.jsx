import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Hero from './components/Hero';
import GlobalMapSection from './components/DemoMap';
import ProjectManagement from './components/ProjectManagement';
import ProjectsShowcase from './components/ProjectsShowcase';
import MetalProducts from './components/MetalProducts';
import Evidence from './components/Evidence';
import CompanyOverview from './components/CompanyOverview';
import VideoBanner from './components/VideoBanner';
import ProductsPage from './pages/ProductsPage';

function HomePage() {
  return (
    <Layout>
      <Hero />
      <Suspense fallback={<div className="global-map-loading">Loading global map...</div>}>
        <GlobalMapSection />
      </Suspense>
      <ProjectManagement />
      <ProjectsShowcase />
      <MetalProducts />
      <Evidence />
      <CompanyOverview />
      <VideoBanner />
    </Layout>
  );
}

function Products() {
  return (
    <Layout>
      <ProductsPage />
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </Router>
  );
}

export default App;
