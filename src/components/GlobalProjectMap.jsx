import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ExternalLink, Building2 } from 'lucide-react';
import './GlobalProjectMap.css';

const GlobalProjectMap = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const autoPlayRef = useRef(null);

  // 真实的项目案例数据（22个，非办事处）
  const projects = [
    {
      id: 0,
      name: 'Kestrel Metal Headquarters',
      location: 'Changsha, China',
      type: 'Corporate HQ & R&D Center',
      description: 'Global headquarters managing all international projects and operations since 2004',
      capacity: '-',
      year: 2004,
      x: 75.5,
      y: 42.5,
      isHQ: true
    },
    {
      id: 1,
      name: 'Shanghai WEEE Copper Recycling Plant',
      location: 'Shanghai, China',
      type: 'E-Waste Recycling Facility',
      description: 'Advanced copper recovery from electronic waste using hydrometallurgical process',
      capacity: '5,000 tpa',
      year: 2015,
      x: 81.5,
      y: 43.5,
      isHQ: false
    },
    {
      id: 2,
      name: 'Yunnan Copper Electrowinning Complex',
      location: 'Kunming, Yunnan, China',
      type: 'Copper EW Project',
      description: 'Large-scale cathode copper production with solvent extraction-electrowinning technology',
      capacity: '240,000 tpa',
      year: 2018,
      x: 73.5,
      y: 47.5,
      isHQ: false
    },
    {
      id: 3,
      name: 'Guangxi Copper Refinery Upgrade',
      location: 'Nanning, Guangxi, China',
      type: 'Technology Modernization',
      description: 'Complete upgrade of existing smelter with advanced process control systems',
      capacity: '3,000 tpa',
      year: 2020,
      x: 76.5,
      y: 50.5,
      isHQ: false
    },
    {
      id: 4,
      name: 'Zijin Mining Copper Smelter EPC',
      location: 'Longyan, Fujian, China',
      type: 'EPC Turnkey Project',
      description: 'Design, procurement, construction of integrated copper smelting facility',
      capacity: '300,000 tpa',
      year: 2019,
      x: 80.5,
      y: 45.5,
      isHQ: false
    },
    {
      id: 5,
      name: 'Jiangxi Copper Cathode Technology',
      location: 'Nanchang, Jiangxi, China',
      type: 'Permanent Cathode Supply',
      description: 'Supply of stainless steel permanent cathode plates for copper electrowinning',
      capacity: '400,000 tpa',
      year: 2021,
      x: 78.5,
      y: 44.5,
      isHQ: false
    },
    {
      id: 6,
      name: 'Inner Mongolia Zinc-Lead Smelter',
      location: 'Hohhot, Inner Mongolia, China',
      type: 'Process Engineering',
      description: 'Comprehensive engineering design for zinc-lead smelting operations',
      capacity: '150,000 tpa',
      year: 2017,
      x: 83.5,
      y: 38.5,
      isHQ: false
    },
    {
      id: 7,
      name: 'Mumbai Cathode Copper Facility',
      location: 'Mumbai, India',
      type: 'EPC Contract',
      description: 'Full EPC delivery of cathode copper production plant for Indian client',
      capacity: '6,000 tpa',
      year: 2019,
      x: 66.5,
      y: 46.5,
      isHQ: false
    },
    {
      id: 8,
      name: 'Jakarta Copper Smelter Expansion',
      location: 'Jakarta, Indonesia',
      type: 'Engineering & Procurement',
      description: 'Capacity expansion project including furnace upgrade and automation system',
      capacity: '100,000 tpa',
      year: 2021,
      x: 82.5,
      y: 58.5,
      isHQ: false
    },
    {
      id: 9,
      name: 'Ho Chi Minh City Copper Refinery',
      location: 'Ho Chi Minh City, Vietnam',
      type: 'Technical Consulting',
      description: 'Process optimization and technology transfer for copper refining operations',
      capacity: '20,000 tpa',
      year: 2022,
      x: 80.5,
      y: 54.5,
      isHQ: false
    },
    {
      id: 10,
      name: 'Almaty Mining Equipment Supply',
      location: 'Almaty, Kazakhstan',
      type: 'Equipment Procurement',
      description: 'Supply chain management for mining and metallurgical equipment to Central Asia',
      capacity: '-',
      year: 2017,
      x: 68.5,
      y: 36.5,
      isHQ: false
    },
    {
      id: 11,
      name: 'Hamburg European Operations Center',
      location: 'Hamburg, Germany',
      type: 'Regional Technical Hub',
      description: 'European base for technical support, spare parts distribution, and client relations',
      capacity: '-',
      year: 2012,
      x: 49.5,
      y: 29.5,
      isHQ: false
    },
    {
      id: 12,
      name: 'Warsaw WEEE Processing Technology',
      location: 'Warsaw, Poland',
      type: 'Technology License',
      description: 'Licensed proprietary copper recycling technology to Polish environmental company',
      capacity: '2,000 tpa',
      year: 2016,
      x: 53.5,
      y: 31.5,
      isHQ: false
    },
    {
      id: 13,
      name: 'Moscow Non-Ferrous Metallurgy Design',
      location: 'Moscow, Russia',
      type: 'Engineering Design',
      description: 'Detailed engineering design for non-ferrous metals processing facility',
      capacity: '-',
      year: 2018,
      x: 70.5,
      y: 27.5,
      isHQ: false
    },
    {
      id: 14,
      name: 'Istanbul Equipment Agency Services',
      location: 'Istanbul, Turkey',
      type: 'Procurement Agent',
      description: 'Strategic sourcing and quality inspection services for metallurgical equipment',
      capacity: '-',
      year: 2020,
      x: 55.5,
      y: 37.5,
      isHQ: false
    },
    {
      id: 15,
      name: 'Belgrade Copper Smelter Modernization',
      location: 'Belgrade, Serbia',
      type: 'Plant Revamp Project',
      description: 'Complete modernization of legacy copper smelter with modern environmental controls',
      capacity: '80,000 tpa',
      year: 2021,
      x: 52.5,
      y: 35.5,
      isHQ: false
    },
    {
      id: 16,
      name: 'Santiago South America Support Center',
      location: 'Santiago, Chile',
      type: 'Regional Office & Projects',
      description: 'South American hub for mining projects support and local client management',
      capacity: '-',
      year: 2013,
      x: 26.5,
      y: 68.5,
      isHQ: false
    },
    {
      id: 17,
      name: 'Lima Copper Concentrator Project',
      location: 'Lima, Peru',
      type: 'Mining-Metallurgical Integration',
      description: 'Integrated concentrator and SX-EW facility for copper oxide ore processing',
      capacity: '50,000 tpa',
      year: 2017,
      x: 25.5,
      y: 65.5,
      isHQ: false
    },
    {
      id: 18,
      name: 'São Paulo Electronic Waste Recycling',
      location: 'São Paulo, Brazil',
      type: 'Full Plant Delivery',
      description: 'Turnkey e-waste recycling plant with precious metals recovery capability',
      capacity: '8,000 tpa',
      year: 2019,
      x: 33.5,
      y: 63.5,
      isHQ: false
    },
    {
      id: 19,
      name: 'Toronto R&D Partnership Program',
      location: 'Toronto, Canada',
      type: 'Research Collaboration',
      description: 'Joint research program on advanced hydrometallurgical processes with Canadian university',
      capacity: '-',
      year: 2020,
      x: 23.5,
      y: 33.5,
      isHQ: false
    },
    {
      id: 20,
      name: 'Lubumbashi Cu-Co Hydrometallurgy Plant',
      location: 'Lubumbashi, DRC',
      type: 'Process Design & Commissioning',
      description: 'Copper-cobalt hydrometallurgical processing plant design and startup support',
      capacity: '40,000 tpa',
      year: 2016,
      x: 55.5,
      y: 59.5,
      isHQ: false
    },
    {
      id: 21,
      name: 'Kitwe Copper Smelter Construction',
      location: 'Kitwe, Zambia',
      type: 'EPC Project Management',
      description: 'EPC management for new copper smelter construction in Zambian Copperbelt',
      capacity: '120,000 tpa',
      year: 2018,
      x: 54.5,
      y: 57.5,
      isHQ: false
    },
    {
      id: 22,
      name: 'Perth Laterite Nickel Technology Transfer',
      location: 'Perth, Australia',
      type: 'Technology Licensing',
      description: 'High-pressure acid leaching (HPAL) technology license for laterite nickel processing',
      capacity: '-',
      year: 2021,
      x: 87.5,
      y: 73.5,
      isHQ: false
    }
  ];

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setAutoPlayIndex((prev) => (prev + 1) % projects.length);
    }, 3500);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  const handleMarkerHover = (project) => {
    setHoveredProject(project);
    setActiveProject(project);
  };

  const handleMarkerLeave = () => {
    setHoveredProject(null);
  };

  const handleMarkerClick = (project) => {
    console.log('Navigate to project:', project.id);
  };

  const getActiveProject = () => {
    if (hoveredProject) return hoveredProject;
    return projects[autoPlayIndex];
  };

  const currentProject = getActiveProject();

  return (
    <div className="global-project-map">
      <div className="map-container">
        <svg viewBox="0 0 100 80" className="world-map-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1f1f1f" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* World map continents - detailed paths */}
          <g className="continents" fill="url(#mapBg)" stroke="#3a3a3a" strokeWidth={0.15}>
            {/* North America */}
            <path d="M5,22 Q10,18 18,19 L28,17 Q38,16 48,18 L52,24 Q50,30 45,34 L38,36 Q32,35 28,37 L22,36 Q16,33 12,30 L6,28 Q3,25 5,22Z" />
            
            {/* South America */}
            <path d="M28,42 Q32,40 36,41 L42,44 Q46,48 44,53 L40,57 Q36,60 32,58 L28,56 Q24,52 26,48 L28,42Z" />
            
            {/* Europe */}
            <path d="M46,22 Q50,20 56,21 L64,20 Q72,22 76,26 L78,32 Q76,36 72,39 L65,41 Q58,40 52,38 L48,34 Q46,28 46,22Z" />
            
            {/* Africa */}
            <path d="M48,42 Q54,40 62,41 L70,44 Q76,48 74,54 L70,60 Q64,64 56,62 L50,60 Q46,54 48,48 L48,42Z" />
            
            {/* Asia */}
            <path d="M62,18 Q72,16 84,18 L92,22 Q98,28 96,36 L90,42 Q84,40 78,42 L72,40 Q66,36 64,32 L62,26 Q60,22 62,18Z" />
            
            {/* Australia */}
            <path d="M82,62 Q86,60 92,61 L96,65 Q98,70 94,74 L88,76 Q82,74 80,70 L82,62Z" />
          </g>

          {/* Grid lines for visual reference */}
          <g className="grid-lines" stroke="#333" strokeWidth={0.05} opacity={0.3}>
            <line x1="0" y1="20" x2="100" y2="20" />
            <line x1="0" y1="40" x2="100" y2="40" />
            <line x1="0" y1="60" x2="100" y2="60" />
            <line x1="25" y1="0" x2="25" y2="80" />
            <line x1="50" y1="0" x2="50" y2="80" />
            <line x1="75" y1="0" x2="75" y2="80" />
          </g>

          {/* Connection line from HQ to active project */}
          {currentProject && !currentProject.isHQ && (
            <motion.path
              d={`M ${projects[0].x} ${projects[0].y} Q ${(projects[0].x + currentProject.x) / 2} ${Math.min(projects[0].y, currentProject.y) - 6} ${currentProject.x} ${currentProject.y}`}
              fill="none"
              stroke="#ff6b35"
              strokeWidth={0.25}
              strokeDasharray="1.5,1.5"
              opacity={0.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="connection-line"
            />
          )}

          {/* Project markers */}
          {projects.map((project) => {
            const isActive = currentProject?.id === project.id;
            const isAutoPlaying = projects[autoPlayIndex]?.id === project.id && !hoveredProject;

            return (
              <g key={project.id}>
                {/* Pulse ring for active/hovered/HQ */}
                {(isActive || isAutoPlaying || project.isHQ) && (
                  <>
                    <motion.circle
                      cx={project.x}
                      cy={project.y}
                      r={isActive ? 2 : (project.isHQ ? 1.8 : 1.5)}
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth={0.2}
                      opacity={0.4}
                      animate={{
                        r: [isActive ? 1 : (project.isHQ ? 0.9 : 0.75), isActive ? 3 : (project.isHQ ? 2.8 : 2.3)],
                        opacity: [0.6, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  </>
                )}

                {/* Main marker dot */}
                <motion.g
                  onClick={() => handleMarkerClick(project)}
                  onMouseEnter={() => handleMarkerHover(project)}
                  onMouseLeave={handleMarkerLeave}
                  style={{ cursor: 'pointer' }}
                  whileHover={{ scale: 1.3 }}
                >
                  <circle
                    cx={project.x}
                    cy={project.y}
                    r={project.isHQ ? 0.9 : (isActive ? 0.75 : 0.55)}
                    fill={project.isHQ ? '#ffffff' : '#ff6b35'}
                    stroke={project.isHQ ? '#ff6b35' : 'none'}
                    strokeWidth={project.isHQ ? 0.25 : 0}
                    style={{
                      filter: isActive ? 'url(#glow)' : 'none'
                    }}
                  >
                    {isAutoPlaying && !hoveredProject && (
                      <animate
                        attributeName="r"
                        values={`${project.isHQ ? 0.9 : 0.55};${project.isHQ ? 1.1 : 0.7};${project.isHQ ? 0.9 : 0.55}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>

                  {/* HQ label */}
                  {project.isHQ && (
                    <text
                      x={project.x}
                      y={project.y - 1.8}
                      textAnchor="middle"
                      className="hq-label"
                      fill="#ffffff"
                      fontSize="1.4"
                      fontWeight="700"
                      fontFamily="Arial, sans-serif"
                    >
                      HQ
                    </text>
                  )}
                </motion.g>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredProject && (
            <motion.div
              className="project-tooltip"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="tooltip-header">
                <Building2 size={16} />
                <span className="tooltip-location">{hoveredProject.location}</span>
              </div>
              <h4 className="tooltip-title">{hoveredProject.name}</h4>
              <p className="tooltip-type">{hoveredProject.type}</p>
              <p className="tooltip-description">{hoveredProject.description}</p>
              <div className="tooltip-details">
                <div className="detail-row">
                  <span className="detail-label">Capacity</span>
                  <span className="detail-value">{hoveredProject.capacity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Year</span>
                  <span className="detail-value">{hoveredProject.year}</span>
                </div>
              </div>
              <button 
                className="tooltip-action" 
                onClick={() => handleMarkerClick(hoveredProject)}
              >
                View Details <ExternalLink size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile auto-play info */}
      {!hoveredProject && (
        <motion.div
          className="mobile-project-info"
          key={autoPlayIndex}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <h4>{currentProject.name}</h4>
          <p>{currentProject.location} • {currentProject.year} • {currentProject.capacity !== '-' ? currentProject.capacity + ' capacity' : 'Established'}</p>
        </motion.div>
      )}

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot hq"></span>
          <span>Headquarters</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot active"></span>
          <span>Current Project ({projects.length - 1})</span>
        </div>
        <div className="legend-item">
          <span className="legend-stat">{projects.length - 1}</span>
          <span>Projects Delivered</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalProjectMap;
