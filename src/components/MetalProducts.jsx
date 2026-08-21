import { useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import './MetalProducts.css';

const products = [
  {
    id: 1,
    name: '3D Wire Panel',
    symbol: '3D',
    material: 'Galvanized Steel',
    features: ['Anti-Climb Design', 'Powder Coated', 'High Security', 'Easy Installation'],
    specs: 'Height: 1.73m - 2.4m',
    price: 'Custom Quote',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    description: 'Premium 3D curved wire panel fence with excellent anti-climb performance for security applications.'
  },
  {
    id: 2,
    name: 'Chain Link',
    symbol: 'CL',
    material: 'Galvanized / PVC Coated',
    features: ['Flexible Installation', 'Corrosion Resistant', 'Various Mesh Sizes', 'Cost Effective'],
    specs: 'Mesh: 50mm x 50mm',
    price: 'Custom Quote',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop',
    description: 'Durable chain link fencing solution for industrial, commercial and agricultural applications.'
  },
  {
    id: 3,
    name: 'Welded Mesh',
    symbol: 'WM',
    material: 'Low Carbon Steel',
    features: ['Rigid Structure', 'Precise Spacing', 'Strong Welding', 'Multiple Coatings'],
    specs: 'Wire: 3mm - 6mm',
    price: 'Custom Quote',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&h=400&fit=crop',
    description: 'High-quality welded wire mesh panels for construction, fencing and industrial filtration.'
  },
  {
    id: 4,
    name: 'Horse Fence',
    symbol: 'HF',
    material: 'Galvanized Steel',
    features: ['Animal Safe Design', 'Smooth Edges', 'Durable Coating', 'Easy Assembly'],
    specs: 'Height: 1.2m - 1.6m',
    price: 'Custom Quote',
    image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=400&fit=crop',
    description: 'Specialized fencing solutions designed for equestrian facilities and livestock management.'
  },
  {
    id: 5,
    name: 'Farm Fence',
    symbol: 'FF',
    material: 'Hot-Dip Galvanized',
    features: ['Livestock Containment', 'Weather Resistant', 'Long Lifespan', 'Low Maintenance'],
    specs: 'Height: 0.9m - 1.8m',
    price: 'Custom Quote',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
    description: 'Agricultural fencing systems for farms, ranches and rural property protection.'
  },
];

const MetalProducts = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedProduct, setSelectedProduct] = useState(products[0]);

  return (
    <section className="metal-products" ref={ref}>
      <div className="metal-products-container">
        <div className="metal-products-left">
          <motion.div
            className="products-header"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="products-title">Metal Products</h2>
            <p className="products-subtitle">Premium fencing & wire mesh solutions</p>
          </motion.div>

          <motion.div
            className="products-list"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {products.map((product) => (
              <button
                key={product.id}
                className={`product-item ${selectedProduct.id === product.id ? 'active' : ''}`}
                onClick={() => setSelectedProduct(product)}
              >
                <span className="product-dot"></span>
                <span className="product-name">{product.name}</span>
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="metal-products-right"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="products-display">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProduct.id}
                className="info-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className="info-header">
                  <span className="product-number">0{selectedProduct.id}</span>
                  <div className="symbol-badge">{selectedProduct.symbol}</div>
                </div>
                <div className="info-content">
                  <h3 className="material-title">{selectedProduct.material}</h3>
                  <ul className="feature-list">
                    {selectedProduct.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="info-footer">
                  <div className="price-display">
                    <span className="price-value">{selectedProduct.specs}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProduct.id}
                className="image-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <img src={selectedProduct.image} alt={selectedProduct.name} />
                <div className="image-overlay">
                  <span className="overlay-symbol">{selectedProduct.symbol}</span>
                  <span className="overlay-name">{selectedProduct.name}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MetalProducts;
