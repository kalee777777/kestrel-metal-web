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
      title: 'Airport Security Fencing',
      location: 'International Airport',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=airport%20security%20fence%20perimeter%203d%20wire%20panel%20galvanized%20steel%20installatio&image_size=landscape_16_9',
      capacity: 'High Security'
    },
    {
      id: 2,
      title: 'Industrial Chain Link Project',
      location: 'Manufacturing Facility',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chain%20link%20fence%20industrial%20perimeter%20galvanized%20wire%20mesh%20factory%20boundary&image_size=landscape_16_9',
      capacity: '2,000m Length'
    },
    {
      id: 3,
      title: 'Agricultural Farm Fencing',
      location: 'Livestock Farm',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=farm%20fence%20agricultural%20wire%20mesh%20livestock%20enclosure%20rural%20countryside&image_size=landscape_16_9',
      capacity: '5,000m Coverage'
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
            <span className="ps-label">OUR PROJECTS</span>
            <h2 className="ps-title">Featured Projects</h2>
          </div>

          <motion.a
            href="#"
            className="read-more-link"
            whileHover={{ x: 5 }}
          >
            View All <ArrowRight size={18} />
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
