import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import './Products.css';

const Products = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [currentProduct, setCurrentProduct] = useState(0);

  const products = [
    {
      id: 1,
      category: 'FENCE PRODUCTS',
      name: '3D Wire Panel Fence',
      subtitle: 'Security & Perimeter Fencing',
      description: 'High-quality 3D curved wire panel fence with excellent anti-climb performance. Powder-coated galvanized steel for superior corrosion resistance, ideal for security applications.',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=3d%20wire%20panel%20fence%20security%20perimeter%20galvanized%20steel%20outdoor%20installation%20professional&image_size=landscape_16_9',
      features: ['Anti-Climb Design', 'Powder Coated', 'Galvanized Steel', 'Easy Installation']
    },
    {
      id: 2,
      category: 'WIRE MESH',
      name: 'Welded Wire Mesh',
      subtitle: 'Construction & Industrial',
      description: 'Premium welded wire mesh panels and rolls for construction reinforcement, concrete pouring, and industrial filtration applications. Various sizes and coatings available.',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=welded%20wire%20mesh%20panel%20construction%20reinforcement%20galvanized%20steel%20grid%20industrial&image_size=landscape_16_9',
      features: ['High Tensile Strength', 'Galvanized Finish', 'Precision Welding', 'Custom Sizes']
    },
    {
      id: 3,
      category: 'WIRE PRODUCTS',
      name: 'Razor Wire & Barbed Wire',
      subtitle: 'High-Security Perimeter',
      description: ' Concertina razor wire and double-twist barbed wire for maximum security perimeter protection. Available in various materials and coatings for military, prison, and border applications.',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=razor%20wire%20barbed%20wire%20security%20perimeter%20military%20prison%20fencing%20galvanized&image_size=landscape_16_9',
      features: ['High Security', 'Galvanized Material', 'Various Coils', 'Long Service Life']
    },
    {
      id: 4,
      category: 'GABION',
      name: 'Gabion Boxes & Mattresses',
      subtitle: 'Erosion Control & Landscaping',
      description: 'Welded and hexagonal gabion baskets, mattresses and erosion control solutions for retaining walls, riverbank protection, landscaping, and architectural decoration.',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gabion%20box%20basket%20stone%20retaining%20wall%20erosion%20control%20riverbank%20protection%20landscaping&image_size=landscape_16_9',
      features: ['High Durability', 'Flexible Structure', 'Eco-Friendly', 'Cost Effective']
    }
  ];

  const nextProduct = () => {
    setCurrentProduct((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentProduct((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <section id="products" className="products" ref={ref}>
      <div className="products-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="section-label">OUR PRODUCTS</span>
          <h2 className="section-title">Product Categories</h2>
          <p className="section-description">
            Comprehensive range of metal products designed for security, construction,
            agriculture and industrial filtration applications
          </p>
        </motion.div>

        <div className="product-showcase">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProduct}
              className="product-content"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="product-image">
                <img src={products[currentProduct].image} alt={products[currentProduct].name} />
                <div className="image-overlay"></div>
              </div>

              <div className="product-info">
                <span className="product-category">{products[currentProduct].category}</span>
                <h3 className="product-name">{products[currentProduct].name}</h3>
                <p className="product-subtitle">{products[currentProduct].subtitle}</p>
                <p className="product-description">{products[currentProduct].description}</p>

                <ul className="product-features">
                  {products[currentProduct].features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>

                <button className="product-cta">
                  Learn More Details <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="product-navigation">
            <motion.button
              className="nav-button"
              onClick={prevProduct}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={24} />
            </motion.button>

            <div className="product-dots">
              {products.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentProduct ? 'active' : ''}`}
                  onClick={() => setCurrentProduct(index)}
                />
              ))}
            </div>

            <motion.button
              className="nav-button"
              onClick={nextProduct}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={24} />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
