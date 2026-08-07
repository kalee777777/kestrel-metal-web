import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star, Circle } from 'lucide-react';
import './Evidence.css';

const Evidence = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const evidenceData = [
    {
      id: '01',
      number: '20',
      unit: 'Years',
      label: 'Industry Experience',
      description: 'Deeply rooted in the metallurgical industry for 20 years, accumulating rich project experience and technical expertise'
    },
    {
      id: '02',
      number: '60+',
      unit: '',
      label: 'Technical Experts',
      description: 'A team of over 60 senior engineers and technical experts'
    },
    {
      id: '03',
      number: '40+',
      unit: '',
      label: 'Patents',
      description: 'Holding over 40 national patents and core technology intellectual property rights'
    },
    {
      id: '04',
      number: '50+',
      unit: '',
      label: 'Countries Served',
      description: 'Business covering more than 50 countries and regions worldwide'
    },
    {
      id: '05',
      number: '4',
      unit: '',
      label: 'Subsidiaries',
      description: 'Establishing 4 subsidiaries globally to build a comprehensive global service system'
    }
  ];

  return (
    <section id="about" className="evidence" ref={ref}>
      <div className="evidence-background">
        <div className="evidence-pattern"></div>
      </div>

      <div className="evidence-container">
        <motion.div
          className="evidence-header"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="evidence-title">EVIDENCE</h2>
          <p className="evidence-subtitle">
            20 years of professional accumulation, 60+ technical experts, 40+ core patents,
            <br />
            global presence in 50+ countries, and 4 strategic subsidiaries,
            <br />
            together building trusted international delivery capability
          </p>
        </motion.div>

        <div className="evidence-grid">
          {evidenceData.map((item, index) => (
            <motion.div
              key={item.id}
              className={`evidence-card ${index === 0 ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="card-header">
                <span className="card-id">{item.id}</span>
                {index === 0 && <Star className="star-icon" size={24} />}
              </div>

              <div className="card-number">
                {item.number}
                {item.unit && <span className="unit">{item.unit}</span>}
              </div>

              <div className="card-label">{item.label}</div>

              {index === 0 && (
                <motion.div
                  className="card-description"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.6 }}
                >
                  <p>{item.description}</p>
                </motion.div>
              )}

              <Circle className="circle-icon" size={12} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="evidence-footer"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <p>True professionalism ultimately comes down to corporate evidence</p>
        </motion.div>
      </div>
    </section>
  );
};

export default Evidence;
