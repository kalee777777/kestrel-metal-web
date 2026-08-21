import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Settings, Shield, Globe, Headphones, ArrowRight } from 'lucide-react';
import './Solutions.css';

const Solutions = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const solutions = [
    {
      id: '01',
      title: 'Custom Manufacturing',
      icon: <Settings size={48} />,
      items: [
        'Tailored Dimensions',
        'Custom Materials',
        'Special Finishes',
        'OEM & ODM Services'
      ],
      featured: false
    },
    {
      id: '02',
      title: 'Quality Assurance',
      icon: <Shield size={48} />,
      items: [
        'ISO Certified',
        'Rigorous QC Testing',
        'Multi-Stage Inspection',
        'Quality Documentation'
      ],
      featured: true
    },
    {
      id: '03',
      title: 'Global Logistics',
      icon: <Globe size={48} />,
      items: [
        '30+ Countries Exported',
        'Trade Documentation',
        'Customs Clearance',
        'Worldwide Shipping'
      ],
      featured: false
    },
    {
      id: '04',
      title: 'Technical Support',
      icon: <Headphones size={48} />,
      items: [
        'Engineering Consultation',
        'Sample Provision',
        'Installation Guidance',
        'After-Sales Service'
      ],
      featured: false
    }
  ];

  return (
    <section id="solutions" className="solutions" ref={ref}>
      <div className="solutions-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="section-label">OUR CAPABILITIES</span>
          <h2 className="section-title">Whatever Your Project Demands</h2>
          <p className="section-description">
            From standard specifications to fully customized solutions, we deliver metal products
            engineered for your exact requirements — on time, on budget, worldwide
          </p>
        </motion.div>

        <div className="solutions-grid">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.id}
              className={`solution-card ${solution.featured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -10, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}
            >
              <div className="card-number">{solution.id}</div>
              <div className="card-icon">{solution.icon}</div>
              <h3 className="card-title">{solution.title}</h3>
              <ul className="card-list">
                {solution.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <div className="card-footer">
                <a href="#" className="card-link">
                Learn More <ArrowRight size={16} />
              </a>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="solutions-cta"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <a href="#" className="view-all-link">
            View All Capabilities <ArrowRight size={20} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Solutions;
