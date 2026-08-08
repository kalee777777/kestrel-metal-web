import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import './CompanyOverview.css';

const CompanyOverview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const cards = [
    {
      number: '01',
      title: 'Who we are',
      description: 'Kestrel Metal is a premier manufacturer of wire mesh and fencing products with 20 years of industry expertise, delivering quality solutions to clients in 50+ countries worldwide.',
      featured: true,
    },
    {
      number: '02',
      title: 'Insight',
      description: 'At the forefront of metallurgical engineering and technological innovation, we continuously advance manufacturing processes and product development to meet evolving market demands.',
      featured: false,
    },
    {
      number: '03',
      title: 'ESG',
      description: 'We recognize that our operations have a profound impact on the environment, society, and the economy. Our commitment to sustainable practices drives every decision we make.',
      featured: false,
    },
  ];

  return (
    <section className="company-overview" ref={ref}>
      <div className="company-overview-container">
        <motion.div
          className="company-overview-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="overview-title">
            Welcome to <span className="highlight">KESTREL</span>
          </h2>
          <p className="overview-subtitle">
            a premier leader at the forefront of metallurgical engineering and technological innovation.
          </p>
        </motion.div>

        <div className="overview-cards-grid">
          {cards.map((card, index) => (
            <motion.div
              key={card.number}
              className={`overview-card ${card.featured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
            >
              <div className="card-number">{card.number}</div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
              <a href="#" className="card-link">
                Read more <ArrowRight size={16} />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyOverview;
