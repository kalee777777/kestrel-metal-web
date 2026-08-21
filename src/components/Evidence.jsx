import { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, Clock, Users, FileText, Globe } from 'lucide-react';
import './Evidence.css';

const Evidence = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredCard, setHoveredCard] = useState(null);

  const cardsData = [
    {
      number: '01',
      type: 'main',
      title: 'REAL INDUSTRIAL IMPACT MUST END IN COMPANY EVIDENCE',
      description: '20 years, 60+ experts, 40+ patents, 50+ countries, 4 subsidiaries, plus talent resources and global project distribution, together establish confidence in international delivery.',
      verticalText: 'REAL INDUSTRIAL IMPACT',
      icon: Sparkles,
    },
    {
      number: '02',
      type: 'stat',
      title: '20 YEARS OF INDUSTRY EXCELLENCE AND TRUSTED DELIVERY',
      description: 'Two decades of dedicated service in the wire mesh and fencing industry, building deep expertise and long-term trust with clients across 30+ countries worldwide.',
      verticalText: '20 YEARS EXCELLENCE',
      icon: Clock,
    },
    {
      number: '03',
      type: 'stat',
      title: '60+ INDUSTRY EXPERTS DELIVERING ENGINEERING EXCELLENCE',
      description: 'A dedicated team of over 60 industry specialists including mechanical engineers, quality inspectors, certified welders, and project managers ensuring excellence in every delivery.',
      verticalText: '60+ EXPERTS',
      icon: Users,
    },
    {
      number: '04',
      type: 'stat',
      title: '40+ TECHNICAL PATENTS INNOVATING MANUFACTURING PROCESSES',
      description: 'More than 40 technical patents covering innovative manufacturing processes, advanced product designs, and proprietary quality control methodologies that set industry benchmarks.',
      verticalText: '40+ PATENTS',
      icon: FileText,
    },
    {
      number: '05',
      type: 'stat',
      title: 'GLOBAL PRESENCE 50+ COUNTRIES 4 OVERSEAS SUBSIDIARIES',
      description: 'Trusted global presence with sales in 50+ countries and 4 overseas subsidiaries strategically located to provide local support, faster delivery, and responsive service to international clients.',
      verticalText: '50+ COUNTRIES 4 SUBSIDIARIES',
      icon: Globe,
    },
  ];

  return (
    <section id="about" className="evidence" ref={ref}>
      <div className="evidence-container">
        <motion.div
          className="evidence-header"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="evidence-title-wrapper">
            <h2 className="evidence-title">evidence</h2>
            <p className="evidence-description">
              20 years of expertise, 60+ specialists, 40+ patents, presence in 50+ countries,
              and 4 subsidiaries build trusted global delivery capability.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="evidence-cards-container"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {cardsData.map((card, index) => {
            const IconComponent = card.icon;
            const isHovered = hoveredCard === index;
            const isMainCard = card.type === 'main';
            const mainCardCollapsed = isMainCard && hoveredCard !== null && hoveredCard !== 0;

            return (
              <motion.div
                key={card.number}
                className={`evidence-card ${card.type} ${isHovered ? 'hovered' : ''} ${mainCardCollapsed ? 'collapsed' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onFocus={() => setHoveredCard(index)}
                onBlur={() => setHoveredCard(null)}
                tabIndex={0}
              >
                <div className="card-inner">
                  <div className="card-number-row">
                    <span className="card-number">{card.number}</span>
                    <IconComponent className="card-icon" size={24} />
                  </div>

                  {isMainCard ? (
                    mainCardCollapsed ? (
                      <>
                        <div className="card-vertical-text">
                          {card.verticalText.split(' ').map((word, i) => (
                            <span key={i}>{word}</span>
                          ))}
                        </div>
                        <div className="card-hover-content">
                          <h3 className="card-heading">{card.title}</h3>
                          <p className="card-text">{card.description}</p>
                        </div>
                      </>
                    ) : (
                      <div className="card-content">
                        <h3 className="card-heading">
                          {card.title}
                        </h3>
                        <p className="card-text">{card.description}</p>
                      </div>
                    )
                  ) : (
                    <>
                      <div className="card-vertical-text">
                        {card.verticalText.split(' ').map((word, i) => (
                          <span key={i}>{word}</span>
                        ))}
                      </div>
                      <div className="card-hover-content">
                        <h3 className="card-heading">{card.title}</h3>
                        <p className="card-text">{card.description}</p>
                      </div>
                    </>
                  )}

                  <div className="card-dot"></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Evidence;
