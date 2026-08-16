import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, Home } from 'lucide-react';
import '../components/Products.css';
import './ProductsPage.css';

const categories = [
  { id: 'all', label: 'ALL PRODUCTS' },
  { id: 'fence', label: 'FENCE PRODUCTS' },
  { id: 'woven', label: 'WOVEN WIRE MESH' },
  { id: 'welded', label: 'WELDED WIRE MESH' },
  { id: 'wire', label: 'WIRE PRODUCTS' },
];

const products = [
  {
    id: 1,
    category: 'fence',
    name: '3D Wire Panel Fence',
    description: 'Cold-formed V-shaped panels with no weld points, smooth surface, excellent weather and corrosion resistance. Ideal for schools, parks, residential communities and industrial zones.',
    specs: 'Height: 630-2230mm | Wire: 3.0-5.0mm',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    featured: true,
  },
  {
    id: 2,
    category: 'fence',
    name: 'Chain Link Fence',
    description: 'Versatile diamond-mesh woven fencing with galvanized or PVC coated surface. Cost-effective solution for residential, commercial and sports facilities.',
    specs: 'Mesh: 50-75mm | Height: 3ft-12ft',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop',
  },
  {
    id: 3,
    category: 'fence',
    name: 'Security Fence',
    description: 'High-security fencing systems including 358 mesh, Y-post airport fence, V-mesh and welded mesh. Used for prisons, military bases and critical infrastructure.',
    specs: 'Panel: 955-2400mm | Mesh Types: 358/3D/V-Mesh',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&h=400&fit=crop',
  },
  {
    id: 4,
    category: 'fence',
    name: 'Farm Fence',
    description: 'Agricultural fencing solutions with hinge joint, S-knot and fixed knot designs. Designed for livestock management and farmland protection.',
    specs: 'Height: 39"-96" | Tensile: ≥550 MPa',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
  },
  {
    id: 5,
    category: 'fence',
    name: 'Fence Posts',
    description: 'Durable round, square and rectangular steel posts with hot-dip galvanized finish. Available in multiple heights and wall thicknesses.',
    specs: 'Ø48-89mm | Thickness: 1.5-5.0mm',
    image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=400&fit=crop',
  },
  {
    id: 6,
    category: 'fence',
    name: 'Fence Accessories',
    description: 'Complete range of post caps, clamps, tension bands, fasteners and hardware. Hot-dip galvanized or PVC coated for lasting protection.',
    specs: 'Sizes: 40-80mm | Material: Galvanized/PVC',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  },
  {
    id: 7,
    category: 'woven',
    name: 'Hexagonal Wire Netting',
    description: 'Machine-woven hexagonal mesh for gabion walls, poultry cages and agricultural fencing. Available in various mesh sizes and wire gauges.',
    specs: 'Mesh: 3/8"-3" | Wire: 20-23 Gauge',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&h=400&fit=crop',
  },
  {
    id: 8,
    category: 'woven',
    name: 'Stainless Screen Mesh',
    description: 'Durable insect-proof mesh for residential and commercial buildings. Made from premium stainless steel with fine mesh openings.',
    specs: 'Mesh: 1"x1" to 80/100+ | SS304/SS316',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop',
  },
  {
    id: 9,
    category: 'woven',
    name: 'Woven Gabion Box',
    description: 'Double-twisted woven gabion baskets for erosion control and retaining walls. Flexible structure conforms to ground movement.',
    specs: 'Mesh: 60×80-100×120mm | Wire: 2.2-3.7mm',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
  },
  {
    id: 10,
    category: 'welded',
    name: 'Welded Wire Mesh Panel',
    description: 'Prefabricated rigid welded mesh panels for construction reinforcement, fencing and barriers. Precision welding ensures consistent quality.',
    specs: 'Panel: 1×2m to 2×4m | Wire: 3.0-8.0mm',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  },
  {
    id: 11,
    category: 'welded',
    name: 'Welded Wire Mesh Roll',
    description: 'Flexible welded mesh rolls for fencing, enclosures and agricultural applications. Easy to install with various surface treatments available.',
    specs: 'Mesh: 1/4"×1/4" to 4"×4" | Width: 3-4ft',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&h=400&fit=crop',
  },
  {
    id: 12,
    category: 'welded',
    name: 'Welded Gabion Box',
    description: 'Welded wire mesh baskets filled with stone for retaining walls, erosion control and landscape decoration. Superior structural integrity.',
    specs: 'Mesh: 50×50-100×100mm | Wire: 2.4-5.0mm',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
  },
  {
    id: 13,
    category: 'wire',
    name: 'Barbed Wire',
    description: 'Traditional double-twist barbed wire for agricultural fencing, livestock boundaries and security perimeters. Available in galvanized and PVC coated.',
    specs: 'Gauge: 12-18ga | Barb Spacing: 75-150mm',
    image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=400&fit=crop',
  },
  {
    id: 14,
    category: 'wire',
    name: 'Razor Wire',
    description: 'High-security concertina razor wire and coils for military, prison and border applications. Made from galvanized steel or stainless steel.',
    specs: 'Blade: BTO/CBT 22-65mm | Core: 2.5-3.0mm',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&h=400&fit=crop',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const ProductsPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const categoryLabels = {
    fence: 'Fence Products',
    woven: 'Woven Wire Mesh',
    welded: 'Welded Wire Mesh',
    wire: 'Wire Products',
  };

  return (
    <div className="products-page">
      <section className="products-page-hero">
        <div className="products-page-hero-bg"></div>
        <div className="products-page-hero-overlay"></div>
        <div className="products-page-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            OUR PRODUCTS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Comprehensive range of metal products designed for security, construction,
            agriculture and industrial filtration applications
          </motion.p>
        </div>
      </section>

      <nav className="breadcrumb">
        <div className="breadcrumb-container">
          <a href="/"><Home size={14} /></a>
          <ChevronRight size={14} />
          <span>Products</span>
        </div>
      </nav>

      <section className="products-page-content">
        <div className="products-page-container">
          <motion.div
            className="category-filter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          <motion.div
            className="products-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={activeCategory}
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  className={`product-card ${product.featured ? 'featured' : ''}`}
                  variants={cardVariants}
                  layout
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="card-image">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <div className="card-overlay">
                      <span className="card-category-tag">
                        {categoryLabels[product.category]}
                      </span>
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{product.name}</h3>
                    <p className="card-description">{product.description}</p>
                    <div className="card-specs">{product.specs}</div>
                    <a href="#" className="card-link">
                      View Details <ArrowRight size={16} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;
