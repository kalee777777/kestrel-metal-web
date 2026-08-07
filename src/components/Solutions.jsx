import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FlaskConical, Wrench, Truck, Cog, ArrowRight } from 'lucide-react';
import './Solutions.css';

const Solutions = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const solutions = [
    {
      id: '01',
      title: 'R&D Services',
      icon: <FlaskConical size={48} />,
      items: [
        'Feasibility Study',
        'Conceptual Design',
        'Laboratory Testing',
        'Pilot Test Validation'
      ],
      featured: false
    },
    {
      id: '02',
      title: 'Engineering',
      icon: <Wrench size={48} />,
      items: [
        'Basic Design (FEED)',
        'Detailed Design (2D & 3D)',
        'Process Optimization',
        'Equipment Selection'
      ],
      featured: true
    },
    {
      id: '03',
      title: 'Procurement',
      icon: <Truck size={48} />,
      items: [
        'Global Supply Chain Management',
        'Quality Control Inspection',
        'Logistics Coordination',
        'Cost Optimization'
      ],
      featured: false
    },
    {
      id: '04',
      title: 'Operations Support',
      icon: <Cog size={48} />,
      items: [
        'Installation & Commissioning',
        'Operator Training',
        'Maintenance Services',
        'Technical Support'
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
          <span className="section-label">SOLUTIONS</span>
          <h2 className="section-title">Comprehensive Metallurgical Solutions</h2>
          <p className="section-description">
            From concept to delivery, we provide complete metallurgical engineering services,
            <br />
            helping your projects succeed
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
            View All Solutions <ArrowRight size={20} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Solutions;
