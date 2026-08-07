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
      name: 'Electrolyte Additives',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yellow%20chemical%20powder%20industrial%20additive%20circular%20container%20laboratory%20sample&image_size=square_hd',
      color: '#ff6b35'
    },
    {
      id: 2,
      name: 'Anode Slime',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=brown%20granular%20material%20industrial%20mining%20byproduct%20circular%20sample%20texture&image_size=square_hd',
      color: '#d2691e'
    },
    {
      id: 3,
      name: 'Copper Powder',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=copper%20powder%20metallic%20orange%20industrial%20material%20fine%20particles%20circular%20sample&image_size=square_hd',
      color: '#cd7f32'
    },
    {
      id: 4,
      name: 'Refining Solvents',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20crystalline%20powder%20chemical%20refining%20solvent%20industrial%20circular%20container&image_size=square_hd',
      color: '#f5f5f5'
    }
  ];

  return (
    <section className="consumables" ref={ref}>
      <div className="consumables-container">
        <motion.div
          className="consumables-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="header-left">
            <span className="section-label">CONSUMABLES</span>
            <h2 className="section-title">Professional Consumables</h2>
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
