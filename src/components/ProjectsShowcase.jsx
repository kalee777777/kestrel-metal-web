import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import './ProjectsShowcase.css';

const ProjectsShowcase = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const projects = [
    {
      id: 1,
      title: 'Copper Recycling Plant',
      location: 'WEEE Processing Facility',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20copper%20recycling%20plant%20modern%20facility%20aerial%20view%20environmental%20friendly&image_size=landscape_16_9',
      capacity: '5,000 tpa'
    },
    {
      id: 2,
      title: 'Cathode Copper Project',
      location: 'Large Scale Metallurgy Complex',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cathode%20copper%20production%20plant%20electrorefining%20industrial%20facility%20massive%20scale&image_size=landscape_16_9',
      capacity: '240,000 tpa'
    },
    {
      id: 3,
      title: 'Electrowinning System',
      location: 'Advanced EW Technology',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=copper%20electrowinning%20system%20electrolytic%20cells%20modern%20technology%20industrial&image_size=landscape_16_9',
      capacity: '3,000 tpa'
    }
  ];

  return (
    <section id="projects" className="projects-showcase" ref={ref}>
      <div className="ps-container">
        <motion.div
          className="ps-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="header-left">
            <span className="ps-label">Standard Projects</span>
            <h2 className="ps-title">Projects</h2>
          </div>

          <motion.a
            href="#"
            className="read-more-link"
            whileHover={{ x: 5 }}
          >
            Read more <ArrowRight size={18} />
          </motion.a>
        </motion.div>

        <motion.div
          className="projects-grid"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="project-card"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -10 }}
            >
              <div className="project-image">
                <img src={project.image} alt={project.title} />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <h3>{project.title}</h3>
                    <p>{project.location}</p>
                    <span className="capacity">{project.capacity}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsShowcase;
