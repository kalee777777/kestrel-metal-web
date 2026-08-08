import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import './Consumables.css';

const Consumables = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const consumables = [
    {
      id: 1,
      name: 'Fence Posts',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=metal%20fence%20posts%20galvanized%20steel%20square%20tube%20construction%20hardware&image_size=square_hd',
      color: '#ff6b35'
    },
    {
      id: 2,
      name: 'Tension Bands',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=metal%20tension%20bands%20fence%20hardware%20galvanized%20steel%20clamps%20construction&image_size=square_hd',
      color: '#d2691e'
    },
    {
      id: 3,
      name: 'Hog Rings & Clips',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hog%20rings%20metal%20clips%20fence%20hardware%20fasteners%20galvanized%20steel&image_size=square_hd',
      color: '#cd7f32'
    },
    {
      id: 4,
      name: 'Gate Hardware',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fence%20gate%20hardware%20hinges%20latches%20locks%20metal%20construction%20accessories&image_size=square_hd',
      color: '#f5f5f5'
    }
  ];

  return (
    <section id="consumables" className="consumables" ref={ref}>
      <div className="consumables-container">
        <motion.div
          className="consumables-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="header-left">
            <span className="section-label">ACCESSORIES</span>
            <h2 className="section-title">Fence Accessories & Fittings</h2>
          </div>

          <motion.a
            href="#"
            className="view-more"
            whileHover={{ x: 5 }}
          >
            View More <ArrowRight size={18} />
          </motion.a>
        </motion.div>

        <div className="consumables-grid">
          {consumables.map((item, index) => (
            <motion.div
              key={item.id}
              className={`consumable-item ${index === 0 ? 'featured' : ''}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.05 }}
            >
              <div
                className="consumable-circle"
                style={{
                  background: index === 0
                    ? `linear-gradient(135deg, var(--color-orange-primary), var(--color-orange-secondary))`
                    : item.color
                }}
              >
                <img src={item.image} alt={item.name} />
              </div>
              <h3 className="consumable-name">{item.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Consumables;
