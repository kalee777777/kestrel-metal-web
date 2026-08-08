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
      number: '10',
      unit: '+',
      label: 'Years of Excellence',
      description: 'Since 2014 in metal manufacturing, specializing in fencing systems and wire mesh products'
    },
    {
      id: '02',
      number: '30',
      unit: '+',
      label: 'Countries Served',
      description: 'Global export network covering more than 30 countries and regions worldwide'
    },
    {
      id: '03',
      number: '200',
      unit: '+',
      label: 'Partner Projects',
      description: 'Long-term industrial partnerships with clients across diverse industries'
    },
    {
      id: '04',
      number: '20000',
      unit: ' sqm',
      label: 'Production Facility',
      description: 'Modern production campus with automated manufacturing lines'
    },
    {
      id: '05',
      number: 'ISO',
      unit: '',
      label: 'Certified Quality',
      description: 'ISO 9001 certified production with rigorous QC at every stage'
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
          <h2 className="evidence-title">OUR STRENGTH</h2>
          <p className="evidence-subtitle">
            Over 10 years of manufacturing excellence, exporting to 30+ countries,
            <br />
            with 200+ successful partner projects and a 20,000 sqm modern facility,
            <br />
            Kestrel Metal is your trusted metal products partner
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
          <p>Your Trusted Metal Products Partner Since 2014</p>
        </motion.div>
      </div>
    </section>
  );
};

export default Evidence;
