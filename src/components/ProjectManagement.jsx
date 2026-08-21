import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MessageSquare, FileText, Truck, Wrench, CheckCircle, Headphones } from 'lucide-react';
import './ProjectManagement.css';

const ProjectManagement = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState('consultation');

  const tabs = [
    { id: 'consultation', label: 'Consultation', icon: <MessageSquare size={20} /> },
    { id: 'design', label: 'Design', icon: <FileText size={20} /> },
    { id: 'production', label: 'Production', icon: <Wrench size={20} /> },
    { id: 'quality', label: 'QC Inspection', icon: <CheckCircle size={20} /> },
    { id: 'logistics', label: 'Logistics', icon: <Truck size={20} /> },
    { id: 'support', label: 'Support', icon: <Headphones size={20} /> }
  ];

  const tabContent = {
    consultation: {
      title: 'Consultation',
      description: 'Project discussion & requirement analysis',
      details: ['Technical consultation', 'Requirement analysis', 'Product recommendation'],
      icon: <MessageSquare size={64} />
    },
    design: {
      title: 'Design',
      description: 'Custom drawings & solution design',
      details: ['CAD drawings', 'Sample customization', 'Material selection'],
      icon: <FileText size={64} />
    },
    production: {
      title: 'Production',
      description: 'Mass production with automated lines',
      details: ['Automated welding', 'Powder coating', 'Galvanizing'],
      icon: <Wrench size={64} />
    },
    quality: {
      title: 'QC Inspection',
      description: 'Multi-stage quality control & testing',
      details: ['Raw material inspection', 'In-process QC', 'Pre-shipment testing'],
      icon: <CheckCircle size={64} />
    },
    logistics: {
      title: 'Logistics',
      description: 'Global shipping & delivery coordination',
      details: ['Packaging & labeling', 'Container loading', 'Shipping arrangement'],
      icon: <Truck size={64} />
    },
    support: {
      title: 'After-Sales Support',
      description: 'Installation guidance & technical support',
      details: ['Installation manual', 'Technical guidance', 'Warranty service'],
      icon: <Headphones size={64} />
    }
  };

  return (
    <section id="management" className="project-management" ref={ref}>
      <div className="pm-container">
        <motion.div
          className="pm-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="pm-label">OUR PROCESS</span>
          <h2 className="pm-title">Custom Manufacturing<br/>Workflow</h2>
        </motion.div>

        <motion.div
          className="pm-showcase"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="pm-background">
            <img
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wire%20mesh%20manufacturing%20factory%20production%20line%20automated%20welding%20galvanized%20steel%20industrial&image_size=landscape_16_9"
              alt="Manufacturing Process"
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
      </div>
    </section>
  );
};

export default ProjectManagement;
