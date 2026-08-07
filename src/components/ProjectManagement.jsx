import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FlaskConical, Wrench, Truck, Cog, Building2, Settings, ArrowRight, MapPin } from 'lucide-react';
import GlobalProjectMap from './GlobalProjectMap';
import './ProjectManagement.css';

const ProjectManagement = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState('research');

  const tabs = [
    { id: 'research', label: 'Research', icon: <FlaskConical size={20} /> },
    { id: 'engineering', label: 'Engineering', icon: <Wrench size={20} /> },
    { id: 'procurement', label: 'Procurement', icon: <Truck size={20} /> },
    { id: 'construction', label: 'Construction', icon: <Building2 size={20} /> },
    { id: 'commissioning', label: 'Commissioning', icon: <Cog size={20} /> },
    { id: 'operations', label: 'Operations&M...', icon: <Settings size={20} /> }
  ];

  const tabContent = {
    research: {
      title: 'Research',
      description: 'Feasibility Study & Conceptual Design',
      details: ['Lab Test', 'Pilot Test'],
      icon: <FlaskConical size={64} />
    },
    engineering: {
      title: 'Engineering',
      description: 'Basic Design (FEED) & Detailed Design (2D & 3D)',
      details: ['Process Optimization', 'Equipment Selection'],
      icon: <Wrench size={64} />
    },
    procurement: {
      title: 'Procurement',
      description: 'Global Supply Chain Management & Quality Control',
      details: ['Logistics Coordination', 'Cost Optimization'],
      icon: <Truck size={64} />
    },
    construction: {
      title: 'Construction',
      description: 'Project Implementation & Site Management',
      details: ['Installation Supervision', 'Quality Assurance'],
      icon: <Building2 size={64} />
    },
    commissioning: {
      title: 'Commissioning',
      description: 'System Startup & Performance Testing',
      details: ['Operator Training', 'Documentation'],
      icon: <Cog size={64} />
    },
    operations: {
      title: 'Operations Support',
      description: 'Maintenance Services & Technical Support',
      details: ['Spare Parts Supply', 'Remote Monitoring'],
      icon: <Settings size={64} />
    }
  };

  const stats = [
    { number: '20', label: 'Years' },
    { number: '60', label: 'Projects' },
    { number: '40', label: 'Patents' },
    { number: '50', label: 'Countries' },
    { number: '4', label: 'Subsidiaries' }
  ];

  return (
    <section className="project-management" ref={ref}>
      <div className="pm-container">
        <motion.div
          className="pm-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="pm-label">Solutions</span>
          <h2 className="pm-title">Project<br/>Management</h2>
        </motion.div>

        <motion.div
          className="pm-showcase"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="pm-background">
            <img
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=laboratory%20research%20scientists%20working%20microscope%20industrial%20metallurgy%20modern%20facility%20professional&image_size=landscape_16_9"
              alt="Research Laboratory"
            />
            <div className="pm-overlay"></div>
          </div>

          <div className="pm-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="pm-info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="info-icon">
                  {tabContent[activeTab].icon}
                </div>
                <div className="info-text">
                  <h3>{tabContent[activeTab].title}</h3>
                  <p className="info-desc">{tabContent[activeTab].description}</p>
                  <ul className="info-details">
                    {tabContent[activeTab].details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pm-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="pm-global"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <GlobalProjectMap />

          <div className="global-stats">
            <p className="stats-intro">
              KESTREL METAL: Five System Solution Provider for Nonferrous Metallurgy
            </p>
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-box">
                  <div className="stat-num">{stat.number}</div>
                  <div className="stat-lbl">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectManagement;
