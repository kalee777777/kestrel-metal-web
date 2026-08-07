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
      category: 'EQUIPMENT',
      name: 'Pb-Sn Anode Plate',
      subtitle: 'For Copper Electrowinning',
      description: 'Advanced Pb-Sn alloy anode plates with excellent corrosion resistance and conductivity, widely used in copper electrowinning processes with a service life of over 10 years.',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20metal%20anode%20plate%20equipment%20copper%20electrorefining%20modern%20manufacturing%20high%20quality&image_size=landscape_16_9',
      features: ['High Corrosion Resistance', 'Excellent Conductivity', 'Long Life Design', 'Precision Manufacturing']
    },
    {
      id: 2,
      category: 'EQUIPMENT',
      name: 'Stainless Steel Cathode',
      subtitle: 'Permanent Cathode Technology',
      description: '316L stainless steel permanent cathode plates with specially treated surfaces to ensure easy copper stripping, significantly improving production efficiency and product quality.',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stainless%20steel%20cathode%20plate%20industrial%20equipment%20metallic%20surface%20modern%20technology&image_size=landscape_16_9',
      features: ['Permanent Design', 'Easy-Strip Coating', 'High Flatness', 'Low Maintenance Cost']
    },
    {
      id: 3,
      category: 'SYSTEM',
      name: 'Smart Electrolysis System',
      subtitle: 'Automated Control Solution',
      description: 'Integrated advanced PLC control and monitoring system for intelligent electrolysis process management, including current density control, temperature monitoring, and level regulation.',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20control%20system%20electrolysis%20automation%20digital%20dashboard%20modern%20technology&image_size=landscape_16_9',
      features: ['Smart Control', 'Real-time Monitoring', 'Data Analysis', 'Remote Operation']
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
          <span className="section-label">PRODUCTS</span>
          <h2 className="section-title">Core Products & Equipment</h2>
          <p className="section-description">
            Advanced metallurgical equipment with superior process performance
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
