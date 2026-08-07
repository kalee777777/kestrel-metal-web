import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';
import './GlobalProjectMap.css';

const GlobalProjectMap = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const autoPlayRef = useRef(null);

  const projects = [
    // 亚洲地区 (8个项目)
    {
      id: 1,
      name: 'Changsha HQ Office',
      location: 'Changsha, China',
      type: 'Headquarters',
      capacity: '-',
      year: 2004,
      x: 75,
      y: 45,
      isHQ: true,
      region: 'asia'
    },
    {
      id: 2,
      name: 'Copper Recycling Plant',
      location: 'Shanghai, China',
      type: 'WEEE Processing',
      capacity: '5,000 tpa',
      year: 2015,
      x: 78,
      y: 47,
      isHQ: false,
      region: 'asia'
    },
    {
      id: 3,
      name: 'Cathode Copper Project',
      location: 'Yunnan, China',
      type: 'Electrowinning',
      capacity: '240,000 tpa',
      year: 2018,
      x: 72,
      y: 50,
      isHQ: false,
      region: 'asia'
    },
    {
      id: 4,
      name: 'Electrowinning System',
      location: 'Guangxi, China',
      type: 'Technology Supply',
      capacity: '3,000 tpa',
      year: 2020,
      x: 74,
      y: 52,
      isHQ: false,
      region: 'asia'
    },
    {
      id: 5,
      name: 'Cathode Copper Project',
      location: 'Mumbai, India',
      type: 'EPC Contract',
      capacity: '6,000 tpa',
      year: 2019,
      x: 62,
      y: 48,
      isHQ: false,
      region: 'asia'
    },
    {
      id: 6,
      name: 'Smelter EPC Project',
      location: 'Jakarta, Indonesia',
      type: 'Engineering',
      capacity: '100,000 tpa',
      year: 2021,
      x: 76,
      y: 55,
      isHQ: false,
      region: 'asia'
    },
    {
      id: 7,
      name: 'Copper Refining Tech',
      location: 'Ho Chi Minh, Vietnam',
      type: 'Consulting',
      capacity: '-',
      year: 2022,
      x: 77,
      y: 53,
      isHQ: false,
      region: 'asia'
    },
    {
      id: 8,
      name: 'Mining Equipment Supply',
      location: 'Kazakhstan',
      type: 'Procurement',
      capacity: '-',
      year: 2017,
      x: 68,
      y: 38,
      isHQ: false,
      region: 'asia'
    },

    // 欧洲地区 (5个项目)
    {
      id: 9,
      name: 'Europe Office',
      location: 'Hamburg, Germany',
      type: 'Regional Office',
      capacity: '-',
      year: 2012,
      x: 48,
      y: 28,
      isHQ: false,
      region: 'europe'
    },
    {
      id: 10,
      name: 'Copper Recycling Tech',
      location: 'Warsaw, Poland',
      type: 'Technology Export',
      capacity: '2,000 tpa',
      year: 2016,
      x: 52,
      y: 30,
      isHQ: false,
      region: 'europe'
    },
    {
      id: 11,
      name: 'Metallurgy Engineering',
      location: 'Moscow, Russia',
      type: 'Design Service',
      capacity: '-',
      year: 2018,
      x: 70,
      y: 26,
      isHQ: false,
      region: 'europe'
    },
    {
      id: 12,
      name: 'Equipment Procurement',
      location: 'Istanbul, Turkey',
      type: 'Agency Service',
      capacity: '-',
      year: 2020,
      x: 54,
      y: 36,
      isHQ: false,
      region: 'europe'
    },
    {
      id: 13,
      name: 'Copper Smelter Upgrade',
      location: 'Belgrade, Serbia',
      type: 'Modernization',
      capacity: '80,000 tpa',
      year: 2021,
      x: 51,
      y: 34,
      isHQ: false,
      region: 'europe'
    },

    // 美洲地区 (4个项目)
    {
      id: 14,
      name: 'South America Office',
      location: 'Santiago, Chile',
      type: 'Regional Office',
      capacity: '-',
      year: 2013,
      x: 25,
      y: 68,
      isHQ: false,
      region: 'americas'
    },
    {
      id: 15,
      name: 'Copper Concentrator',
      location: 'Lima, Peru',
      type: 'Mining Project',
      capacity: '50,000 tpa',
      year: 2017,
      x: 24,
      y: 65,
      isHQ: false,
      region: 'americas'
    },
    {
      id: 16,
      name: 'E-Waste Recycling Plant',
      location: 'São Paulo, Brazil',
      type: 'Full Plant',
      capacity: '8,000 tpa',
      year: 2019,
      x: 32,
      y: 62,
      isHQ: false,
      region: 'americas'
    },
    {
      id: 17,
      name: 'R&D Collaboration',
      location: 'Toronto, Canada',
      type: 'Research Partner',
      capacity: '-',
      year: 2020,
      x: 22,
      y: 32,
      isHQ: false,
      region: 'americas'
    },

    // 非洲 & 大洋洲 (4个项目)
    {
      id: 18,
      name: 'Cu-Co Hydrometallurgy',
      location: 'Lubumbashi, DRC',
      type: 'Process Design',
      capacity: '40,000 tpa',
      year: 2016,
      x: 54,
      y: 58,
      isHQ: false,
      region: 'africa'
    },
    {
      id: 19,
      name: 'Copper Smelter Construction',
      location: 'Kitwe, Zambia',
      type: 'EPC Project',
      capacity: '120,000 tpa',
      year: 2018,
      x: 53,
      y: 56,
      isHQ: false,
      region: 'africa'
    },
    {
      id: 20,
      name: 'Laterite Nickel Technology',
      location: 'Perth, Australia',
      type: 'Technology License',
      capacity: '-',
      year: 2021,
      x: 85,
      y: 72,
      isHQ: false,
      region: 'oceania'
    },
    {
      id: 21,
      name: 'PGM Recovery Plant',
      location: 'Johannesburg, SA',
      type: 'Precious Metals',
      capacity: '500 tpa',
      year: 2022,
      x: 52,
      y: 70,
      isHQ: false,
      region: 'africa'
    }
  ];

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setAutoPlayIndex((prev) => (prev + 1) % projects.length);
    }, 3000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  const handleProjectHover = (project) => {
    setHoveredProject(project);
    setActiveProject(project);
  };

  const handleProjectLeave = () => {
    setHoveredProject(null);
  };

  const handleProjectClick = (project) => {
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
        <svg viewBox="0 0 100 55" className="world-map-svg" preserveAspectRatio="xMidYMid meet">
          {/* Simplified world map outline */}
          <defs>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
          </defs>

          {/* World continents - simplified paths */}
          <path
            d="M15,25 Q20,22 28,24 L35,23 Q42,25 48,22 L52,26 Q50,30 48,33 L44,35 Q40,34 38,36 L35,38 Q30,37 25,39 L20,37 Q16,34 14,30 Z"
            fill="url(#mapGradient)"
            stroke="#3a3a3a"
            strokeWidth="0.3"
            className="continent"
          />
          <path
            d="M48,18 Q55,16 62,18 L70,17 Q78,19 85,22 L88,28 Q86,32 82,35 L75,38 Q68,36 60,38 L52,36 Q49,32 48,28 Z"
            fill="url(#mapGradient)"
            stroke="#3a3a3a"
            strokeWidth="0.3"
            className="continent"
          />
          <path
            d="M22,42 Q28,40 35,41 L42,43 Q48,46 52,48 L50,52 Q44,54 38,53 L30,52 Q24,50 20,47 Z"
            fill="url(#mapGradient)"
            stroke="#3a3a3a"
            strokeWidth="0.3"
            className="continent"
          />
          <path
            d="M80,42 Q84,40 88,42 L90,46 Q89,50 86,52 L82,51 Q79,48 80,44 Z"
            fill="url(#mapGradient)"
            stroke="#3a3a3a"
            strokeWidth="0.3"
            className="continent"
          />

          {/* Connection lines from HQ to active project */}
          {currentProject && !currentProject.isHQ && (
            <motion.path
              d={`M ${projects[0].x} ${projects[0].y} Q ${(projects[0].x + currentProject.x) / 2} ${(projects[0].y + currentProject.y) / 2 - 5} ${currentProject.x} ${currentProject.y}`}
              fill="none"
              stroke="#ff6b35"
              strokeWidth="0.2"
              strokeDasharray="2,2"
              opacity="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="connection-line"
            />
          )}

          {/* Project markers */}
          {projects.map((project) => {
            const isActive = currentProject?.id === project.id;
            const isAutoPlaying = projects[autoPlayIndex]?.id === project.id && !hoveredProject;

            return (
              <g
                key={project.id}
                onClick={() => handleProjectClick(project)}
                onMouseEnter={() => handleProjectHover(project)}
                onMouseLeave={handleProjectLeave}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring for active/hovered/auto-playing */}
                {(isActive || isAutoPlaying || project.isHQ) && (
                  <>
                    <motion.circle
                      cx={project.x}
                      cy={project.y}
                      r={isActive ? 1.2 : 0.9}
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth="0.15"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{
                        scale: isActive ? 2.5 : 2,
                        opacity: 0
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  </>
                )}

                {/* Main dot */}
                <motion.circle
                  cx={project.x}
                  cy={project.y}
                  r={project.isHQ ? 0.7 : (isActive ? 0.65 : 0.45)}
                  fill={project.isHQ ? "#fff" : "#ff6b35"}
                  stroke={project.isHQ ? "#ff6b35" : "none"}
                  strokeWidth={project.isHQ ? "0.2" : "0"}
                  whileHover={{ scale: 1.8 }}
                  animate={{
                    scale: isAutoPlaying && !hoveredProject ? [1, 1.3, 1] : 1,
                  }}
                  transition={
                    isAutoPlaying && !hoveredProject
                      ? { duration: 1.5, repeat: Infinity }
                      : {}
                  }
                  className={isActive ? 'dot-active' : ''}
                  filter={isActive ? "url(#glow)" : ""}
                />

                {/* HQ label */}
                {project.isHQ && (
                  <text
                    x={project.x}
                    y={project.y - 1.2}
                    textAnchor="middle"
                    className="hq-label"
                    fill="#fff"
                    fontSize="1.2"
                    fontWeight="700"
                  >
                    HQ
                  </text>
                )}
              </g>
            );
          })}

          {/* Glow filter definition */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
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
              style={{
                left: `${Math.min(hoveredProject.x, 70)}%`,
                top: `${Math.min(hoveredProject.y, 40)}%`
              }}
            >
              <div className="tooltip-header">
                <MapPin size={16} />
                <span className="tooltip-location">{hoveredProject.location}</span>
              </div>
              <h4 className="tooltip-title">{hoveredProject.name}</h4>
              <div className="tooltip-details">
                <div className="detail-row">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{hoveredProject.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Capacity</span>
                  <span className="detail-value">{hoveredProject.capacity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Year</span>
                  <span className="detail-value">{hoveredProject.year}</span>
                </div>
              </div>
              <button className="tooltip-action">
                View Details <ExternalLink size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current project info panel (visible on mobile or when no hover) */}
      {!hoveredProject && (
        <motion.div
          className="mobile-project-info"
          key={autoPlayIndex}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <h4>{currentProject.name}</h4>
          <p>{currentProject.location} • {currentProject.year}</p>
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
          <span>Active Project</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot"></span>
          <span>Completed ({projects.length - 1})</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalProjectMap;
