import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Building2 } from 'lucide-react';
import './GlobalProjectMap.css';

const GlobalProjectMap = () => {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const autoPlayRef = useRef(null);

  // 22个真实项目案例
  const projects = [
    {
      id: 0, name: 'Kestrel Metal Headquarters', location: 'Changsha, China',
      type: 'Corporate HQ & R&D Center', description: 'Global headquarters managing all international projects since 2004',
      capacity: '-', year: 2004, x: 75.5, y: 42.5, isHQ: true
    },
    {
      id: 1, name: 'Shanghai WEEE Copper Recycling Plant', location: 'Shanghai, China',
      type: 'E-Waste Recycling Facility', description: 'Advanced copper recovery from electronic waste using hydrometallurgical process',
      capacity: '5,000 tpa', year: 2015, x: 81.5, y: 43.5, isHQ: false
    },
    {
      id: 2, name: 'Yunnan Copper Electrowinning Complex', location: 'Kunming, Yunnan, China',
      type: 'Copper EW Project', description: 'Large-scale cathode copper production with SX-EW technology',
      capacity: '240,000 tpa', year: 2018, x: 73.5, y: 47.5, isHQ: false
    },
    {
      id: 3, name: 'Guangxi Copper Refinery Upgrade', location: 'Nanning, Guangxi, China',
      type: 'Technology Modernization', description: 'Complete upgrade with advanced process control systems',
      capacity: '3,000 tpa', year: 2020, x: 76.5, y: 50.5, isHQ: false
    },
    {
      id: 4, name: 'Zijin Mining Copper Smelter EPC', location: 'Longyan, Fujian, China',
      type: 'EPC Turnkey Project', description: 'Design, procurement, construction of integrated smelting facility',
      capacity: '300,000 tpa', year: 2019, x: 80.5, y: 45.5, isHQ: false
    },
    {
      id: 5, name: 'Jiangxi Copper Cathode Technology', location: 'Nanchang, Jiangxi, China',
      type: 'Permanent Cathode Supply', description: 'Supply of stainless steel permanent cathode plates',
      capacity: '400,000 tpa', year: 2021, x: 78.5, y: 44.5, isHQ: false
    },
    {
      id: 6, name: 'Inner Mongolia Zinc-Lead Smelter', location: 'Hohhot, Inner Mongolia, China',
      type: 'Process Engineering', description: 'Comprehensive engineering design for zinc-lead smelting',
      capacity: '150,000 tpa', year: 2017, x: 83.5, y: 38.5, isHQ: false
    },
    {
      id: 7, name: 'Mumbai Cathode Copper Facility', location: 'Mumbai, India',
      type: 'EPC Contract', description: 'Full EPC delivery of cathode copper production plant',
      capacity: '6,000 tpa', year: 2019, x: 66.5, y: 46.5, isHQ: false
    },
    {
      id: 8, name: 'Jakarta Copper Smelter Expansion', location: 'Jakarta, Indonesia',
      type: 'Engineering & Procurement', description: 'Capacity expansion with furnace upgrade and automation',
      capacity: '100,000 tpa', year: 2021, x: 82.5, y: 58.5, isHQ: false
    },
    {
      id: 9, name: 'Ho Chi Minh City Copper Refinery', location: 'Ho Chi Minh City, Vietnam',
      type: 'Technical Consulting', description: 'Process optimization and technology transfer',
      capacity: '20,000 tpa', year: 2022, x: 80.5, y: 54.5, isHQ: false
    },
    {
      id: 10, name: 'Almaty Mining Equipment Supply', location: 'Almaty, Kazakhstan',
      type: 'Equipment Procurement', description: 'Supply chain management for mining equipment to Central Asia',
      capacity: '-', year: 2017, x: 68.5, y: 36.5, isHQ: false
    },
    {
      id: 11, name: 'Hamburg European Operations Center', location: 'Hamburg, Germany',
      type: 'Regional Technical Hub', description: 'European base for technical support and client relations',
      capacity: '-', year: 2012, x: 49.5, y: 29.5, isHQ: false
    },
    {
      id: 12, name: 'Warsaw WEEE Processing Technology', location: 'Warsaw, Poland',
      type: 'Technology License', description: 'Licensed proprietary copper recycling technology',
      capacity: '2,000 tpa', year: 2016, x: 53.5, y: 31.5, isHQ: false
    },
    {
      id: 13, name: 'Moscow Non-Ferrous Metallurgy Design', location: 'Moscow, Russia',
      type: 'Engineering Design', description: 'Detailed engineering for non-ferrous metals processing',
      capacity: '-', year: 2018, x: 70.5, y: 27.5, isHQ: false
    },
    {
      id: 14, name: 'Istanbul Equipment Agency Services', location: 'Istanbul, Turkey',
      type: 'Procurement Agent', description: 'Strategic sourcing and quality inspection services',
      capacity: '-', year: 2020, x: 55.5, y: 37.5, isHQ: false
    },
    {
      id: 15, name: 'Belgrade Copper Smelter Modernization', location: 'Belgrade, Serbia',
      type: 'Plant Revamp Project', description: 'Complete modernization with environmental controls',
      capacity: '80,000 tpa', year: 2021, x: 52.5, y: 35.5, isHQ: false
    },
    {
      id: 16, name: 'Santiago South America Support Center', location: 'Santiago, Chile',
      type: 'Regional Office & Projects', description: 'South American hub for mining projects support',
      capacity: '-', year: 2013, x: 26.5, y: 68.5, isHQ: false
    },
    {
      id: 17, name: 'Lima Copper Concentrator Project', location: 'Lima, Peru',
      type: 'Mining-Metallurgical Integration', description: 'Integrated concentrator and SX-EW facility',
      capacity: '50,000 tpa', year: 2017, x: 25.5, y: 65.5, isHQ: false
    },
    {
      id: 18, name: 'São Paulo Electronic Waste Recycling', location: 'São Paulo, Brazil',
      type: 'Full Plant Delivery', description: 'Turnkey e-waste recycling plant with precious metals recovery',
      capacity: '8,000 tpa', year: 2019, x: 33.5, y: 63.5, isHQ: false
    },
    {
      id: 19, name: 'Toronto R&D Partnership Program', location: 'Toronto, Canada',
      type: 'Research Collaboration', description: 'Joint research on advanced hydrometallurgical processes',
      capacity: '-', year: 2020, x: 23.5, y: 33.5, isHQ: false
    },
    {
      id: 20, name: 'Lubumbashi Cu-Co Hydrometallurgy Plant', location: 'Lubumbashi, DRC',
      type: 'Process Design & Commissioning', description: 'Copper-cobalt hydrometallurgical processing plant design',
      capacity: '40,000 tpa', year: 2016, x: 55.5, y: 59.5, isHQ: false
    },
    {
      id: 21, name: 'Kitwe Copper Smelter Construction', location: 'Kitwe, Zambia',
      type: 'EPC Project Management', description: 'EPC management for new smelter in Zambian Copperbelt',
      capacity: '120,000 tpa', year: 2018, x: 54.5, y: 57.5, isHQ: false
    },
    {
      id: 22, name: 'Perth Laterite Nickel Technology Transfer', location: 'Perth, Australia',
      type: 'Technology Licensing', description: 'HPAL technology license for laterite nickel processing',
      capacity: '-', year: 2021, x: 87.5, y: 73.5, isHQ: false
    }
  ];

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setAutoPlayIndex((prev) => (prev + 1) % projects.length);
    }, 3500);
    return () => clearInterval(autoPlayRef.current);
  }, []);

  const currentProject = hoveredProject || projects[autoPlayIndex];

  return (
    <div className="global-project-map">
      <div className="map-container">
        <svg viewBox="0 0 100 60" className="world-map-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="oceanGradient" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#16213e" />
            </radialGradient>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d3436" />
              <stop offset="100%" stopColor="#353b48" />
            </linearGradient>
            <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="shadowFilter">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity={0.3}/>
            </filter>
          </defs>

          {/* Ocean background */}
          <rect width="100" height="60" fill="url(#oceanGradient)" />

          {/* World map - detailed continent paths */}
          <g className="continents" fill="url(#landGradient)" stroke="#4a5568" strokeWidth={0.25} filter="url(#shadowFilter)">
            {/* North America */}
            <path d="M8,18 L15,15 L28,14 L42,16 L48,20 L45,26 L40,30 L32,32 L24,30 L16,28 L10,24 Z M12,34 L18,33 L25,35 L28,40 L24,44 L18,43 L12,40 Z" />
            
            {/* South America */}
            <path d="M28,46 L34,44 L40,46 L42,52 L40,57 L34,58 L28,56 L26,51 Z" />
            
            {/* Europe */}
            <path d="M46,20 L52,19 L62,20 L68,24 L66,30 L60,32 L54,30 L48,28 L46,24 Z" />
            
            {/* Africa */}
            <path d="M48,34 L56,33 L64,35 L68,42 L66,50 L58,53 L50,52 L47,44 Z" />
            
            {/* Asia (larger, more detailed) */}
            <path d="M62,18 L72,16 L84,18 L92,24 L94,32 L90,38 L82,40 L74,38 L68,34 L64,28 L62,22 Z M86,42 L92,41 L96,46 L94,52 L88,54 L84,50 Z" />
            
            {/* Australia */}
            <path d="M84,56 L92,55 L97,58 L96,63 L90,64 L84,61 Z" />
          </g>

          {/* Grid lines - subtle */}
          <g stroke="#4a5568" strokeWidth={0.08} opacity={0.2}>
            {[20, 30, 40, 50].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} />
            ))}
            {[25, 50, 75].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="60" />
            ))}
          </g>

          {/* Connection lines from HQ to active project */}
          {currentProject && !currentProject.isHQ && (
            <motion.path
              d={`M ${projects[0].x} ${projects[0].y} Q ${(projects[0].x + currentProject.x) / 2} ${Math.min(projects[0].y, currentProject.y) - 5} ${currentProject.x} ${currentProject.y}`}
              fill="none"
              stroke="#ff6b35"
              strokeWidth={0.3}
              strokeDasharray="2,2"
              opacity={0.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5 }}
            />
          )}

          {/* Project markers */}
          {projects.map((project) => {
            const isActive = currentProject?.id === project.id;
            const isAutoPlaying = projects[autoPlayIndex]?.id === project.id && !hoveredProject;

            return (
              <g key={project.id}>
                {/* Pulse ring */}
                {(isActive || isAutoPlaying || project.isHQ) && (
                  <>
                    <circle
                      cx={project.x} cy={project.y}
                      r={isActive ? 2.5 : (project.isHQ ? 2 : 1.8)}
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth={0.3}
                      opacity={0.5}
                    >
                      <animate
                        attributeName="r"
                        values={`${isActive ? 1 : (project.isHQ ? 0.9 : 0.7)};${isActive ? 3.5 : (project.isHQ ? 3 : 2.5)};${isActive ? 1 : (project.isHQ ? 0.9 : 0.7)}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                {/* Main marker */}
                <motion.g
                  onMouseEnter={() => setHoveredProject(project)}
                  onMouseLeave={() => setHoveredProject(null)}
                  whileHover={{ scale: 1.4 }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={project.x}
                    cy={project.y}
                    r={project.isHQ ? 1.1 : (isActive ? 0.95 : 0.7)}
                    fill={project.isHQ ? '#ffffff' : '#ff6b35'}
                    stroke={project.isHQ ? '#ff6b35' : 'none'}
                    strokeWidth={project.isHQ ? 0.35 : 0}
                    filter={isActive ? 'url(#glowEffect)' : ''}
                  >
                    {isAutoPlaying && !hoveredProject && (
                      <animate
                        attributeName="r"
                        values={`${project.isHQ ? 1.1 : 0.7};${project.isHQ ? 1.35 : 0.85};${project.isHQ ? 1.1 : 0.7}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>

                  {/* HQ label */}
                  {project.isHQ && (
                    <text
                      x={project.x}
                      y={project.y - 2.2}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="1.6"
                      fontWeight="700"
                      fontFamily="Arial, sans-serif"
                      filter="url(#glowEffect)"
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
                <span>{hoveredProject.location}</span>
              </div>
              <h4>{hoveredProject.name}</h4>
              <p className="tooltip-type">{hoveredProject.type}</p>
              <p className="tooltip-description">{hoveredProject.description}</p>
              <div className="tooltip-details">
                <div className="detail-row">
                  <span>Capacity</span>
                  <strong>{hoveredProject.capacity}</strong>
                </div>
                <div className="detail-row">
                  <span>Year</span>
                  <strong>{hoveredProject.year}</strong>
                </div>
              </div>
              <button className="tooltip-action">
                View Details <ExternalLink size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile info */}
      {!hoveredProject && (
        <motion.div
          className="mobile-project-info"
          key={autoPlayIndex}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h4>{currentProject.name}</h4>
          <p>{currentProject.location} • {currentProject.year} • {currentProject.capacity !== '-' ? currentProject.capacity : 'Established'}</p>
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
          <span>Active ({projects.length - 1})</span>
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
