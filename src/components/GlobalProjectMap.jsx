import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { MapPin, ExternalLink, Building2 } from 'lucide-react';
import './GlobalProjectMap.css';

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const GlobalProjectMap = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const autoPlayRef = useRef(null);

  // 真实的项目案例数据（非办事处）
  const projects = [
    // 总部
    {
      id: 0,
      name: 'Kestrel Metal Headquarters',
      location: 'Changsha, China',
      type: 'Corporate HQ & R&D Center',
      description: 'Global headquarters managing all international projects and operations',
      capacity: '-',
      year: 2004,
      coordinates: [112.94, 28.23],
      isHQ: true,
      region: 'asia'
    },

    // 中国项目 (6个)
    {
      id: 1,
      name: 'Shanghai WEEE Copper Recycling Plant',
      location: 'Shanghai, China',
      type: 'E-Waste Recycling Facility',
      description: 'Advanced copper recovery from electronic waste using hydrometallurgical process',
      capacity: '5,000 tpa',
      year: 2015,
      coordinates: [121.47, 31.23],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 2,
      name: 'Yunnan Copper Electrowinning Complex',
      location: 'Kunming, Yunnan, China',
      type: 'Copper EW Project',
      description: 'Large-scale cathode copper production with solvent extraction-electrowinning technology',
      capacity: '240,000 tpa',
      year: 2018,
      coordinates: [102.83, 25.04],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 3,
      name: 'Guangxi Copper Refinery Upgrade',
      location: 'Nanning, Guangxi, China',
      type: 'Technology Modernization',
      description: 'Complete upgrade of existing smelter with advanced process control systems',
      capacity: '3,000 tpa',
      year: 2020,
      coordinates: [108.32, 22.82],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 4,
      name: 'Zijin Mining Copper Smelter',
      location: 'Longyan, Fujian, China',
      type: 'EPC Turnkey Project',
      description: 'Design, procurement, construction of integrated copper smelting facility',
      capacity: '300,000 tpa',
      year: 2019,
      coordinates: [117.03, 25.09],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 5,
      name: 'Jiangxi Copper Cathode Plant',
      location: 'Nanchang, Jiangxi, China',
      type: 'Permanent Cathode Technology',
      description: 'Supply of stainless steel permanent cathode plates for copper electrowinning',
      capacity: '400,000 tpa',
      year: 2021,
      coordinates: [115.89, 28.68],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 6,
      name: 'Inner Mongolia Zinc-Lead Smelter',
      location: 'Hohhot, Inner Mongolia, China',
      type: 'Process Engineering',
      description: 'Comprehensive engineering design for zinc-lead smelting operations',
      capacity: '150,000 tpa',
      year: 2017,
      coordinates: [111.75, 40.84],
      isHQ: false,
      region: 'asia'
    },

    // 亚洲其他地区 (4个)
    {
      id: 7,
      name: 'Mumbai Cathode Copper Facility',
      location: 'Mumbai, India',
      type: 'EPC Contract',
      description: 'Full EPC delivery of cathode copper production plant for Indian client',
      capacity: '6,000 tpa',
      year: 2019,
      coordinates: [72.87, 19.07],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 8,
      name: 'Jakarta Copper Smelter Expansion',
      location: 'Jakarta, Indonesia',
      type: 'Engineering & Procurement',
      description: 'Capacity expansion project including furnace upgrade and automation system',
      capacity: '100,000 tpa',
      year: 2021,
      coordinates: [106.84, -6.21],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 9,
      name: 'Ho Chi Minh City Copper Refinery',
      location: 'Ho Chi Minh City, Vietnam',
      type: 'Technical Consulting',
      description: 'Process optimization and technology transfer for copper refining operations',
      capacity: '20,000 tpa',
      year: 2022,
      coordinates: [106.70, 10.76],
      isHQ: false,
      region: 'asia'
    },
    {
      id: 10,
      name: 'Almaty Mining Equipment Supply',
      location: 'Almaty, Kazakhstan',
      type: 'Equipment Procurement',
      description: 'Supply chain management for mining and metallurgical equipment to Central Asia',
      capacity: '-',
      year: 2017,
      coordinates: [76.85, 43.22],
      isHQ: false,
      region: 'asia'
    },

    // 欧洲项目 (5个)
    {
      id: 11,
      name: 'Hamburg European Operations Center',
      location: 'Hamburg, Germany',
      type: 'Regional Technical Hub',
      description: 'European base for technical support, spare parts distribution, and client relations',
      capacity: '-',
      year: 2012,
      coordinates: [10.00, 53.55],
      isHQ: false,
      region: 'europe'
    },
    {
      id: 12,
      name: 'Warsaw WEEE Processing Technology',
      location: 'Warsaw, Poland',
      type: 'Technology License',
      description: 'Licensed proprietary copper recycling technology to Polish environmental company',
      capacity: '2,000 tpa',
      year: 2016,
      coordinates: [21.01, 52.23],
      isHQ: false,
      region: 'europe'
    },
    {
      id: 13,
      name: 'Moscow Non-Ferrous Metallurgy Design',
      location: 'Moscow, Russia',
      type: 'Engineering Design',
      description: 'Detailed engineering design for non-ferrous metals processing facility',
      capacity: '-',
      year: 2018,
      coordinates: [37.61, 55.75],
      isHQ: false,
      region: 'europe'
    },
    {
      id: 14,
      name: 'Istanbul Equipment Agency Services',
      location: 'Istanbul, Turkey',
      type: 'Procurement Agent',
      description: 'Strategic sourcing and quality inspection services for metallurgical equipment',
      capacity: '-',
      year: 2020,
      coordinates: [28.97, 41.01],
      isHQ: false,
      region: 'europe'
    },
    {
      id: 15,
      name: 'Belgrade Copper Smelter Modernization',
      location: 'Belgrade, Serbia',
      type: 'Plant Revamp Project',
      description: 'Complete modernization of legacy copper smelter with modern environmental controls',
      capacity: '80,000 tpa',
      year: 2021,
      coordinates: [20.46, 44.79],
      isHQ: false,
      region: 'europe'
    },

    // 美洲项目 (4个)
    {
      id: 16,
      name: 'Santiago South America Support Center',
      location: 'Santiago, Chile',
      type: 'Regional Office & Projects',
      description: 'South American hub for mining projects support and local client management',
      capacity: '-',
      year: 2013,
      coordinates: [-70.65, -33.45],
      isHQ: false,
      region: 'americas'
    },
    {
      id: 17,
      name: 'Lima Copper Concentrator Project',
      location: 'Lima, Peru',
      type: 'Mining-Metallurgical Integration',
      description: 'Integrated concentrator and SX-EW facility for copper oxide ore processing',
      capacity: '50,000 tpa',
      year: 2017,
      coordinates: [-77.03, -12.05],
      isHQ: false,
      region: 'americas'
    },
    {
      id: 18,
      name: 'São Paulo Electronic Waste Recycling',
      location: 'São Paulo, Brazil',
      type: 'Full Plant Delivery',
      description: 'Turnkey e-waste recycling plant with precious metals recovery capability',
      capacity: '8,000 tpa',
      year: 2019,
      coordinates: [-46.63, -23.55],
      isHQ: false,
      region: 'americas'
    },
    {
      id: 19,
      name: 'Toronto R&D Partnership Program',
      location: 'Toronto, Canada',
      type: 'Research Collaboration',
      description: 'Joint research program on advanced hydrometallurgical processes with Canadian university',
      capacity: '-',
      year: 2020,
      coordinates: [-79.38, 43.65],
      isHQ: false,
      region: 'americas'
    },

    // 非洲 & 大洋洲 (3个)
    {
      id: 20,
      name: 'Lubumbashi Cu-Co Hydrometallurgy Plant',
      location: 'Lubumbashi, DRC',
      type: 'Process Design & Commissioning',
      description: 'Copper-cobalt hydrometallurgical processing plant design and startup support',
      capacity: '40,000 tpa',
      year: 2016,
      coordinates: [27.49, -11.66],
      isHQ: false,
      region: 'africa'
    },
    {
      id: 21,
      name: 'Kitwe Copper Smelter Construction',
      location: 'Kitwe, Zambia',
      type: 'EPC Project Management',
      description: 'EPC management for new copper smelter construction in Zambian Copperbelt',
      capacity: '120,000 tpa',
      year: 2018,
      coordinates: [28.20, -12.81],
      isHQ: false,
      region: 'africa'
    },
    {
      id: 22,
      name: 'Perth Laterite Nickel Technology Transfer',
      location: 'Perth, Australia',
      type: 'Technology Licensing',
      description: 'High-pressure acid leaching (HPAL) technology license for laterite nickel processing',
      capacity: '-',
      year: 2021,
      coordinates: [115.86, -31.95],
      isHQ: false,
      region: 'oceania'
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
        <ComposableMap
          projection="geoEqualEarth"
          className="react-simple-map"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#2a2a2a"
                  stroke="#3a3a3a"
                  strokeWidth={0.5}
                  style={{
                    hover: { fill: "#3a3a3a" }
                  }}
                />
              ))
            }
          </Geographies>

          {/* Connection line from HQ to active project */}
          {currentProject && !currentProject.isHQ && (
            <path
              d={`M ${projects[0].coordinates[0]} ${projects[0].coordinates[1]} Q ${(projects[0].coordinates[0] + currentProject.coordinates[0]) / 2} ${(projects[0].coordinates[1] + currentProject.coordinates[1]) / 2 - 8} ${currentProject.coordinates[0]} ${currentProject.coordinates[1]}`}
              fill="none"
              stroke="#ff6b35"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.4}
              className="connection-line"
            />
          )}

          {/* Project markers */}
          {projects.map((project) => {
            const isActive = currentProject?.id === project.id;
            const isAutoPlaying = projects[autoPlayIndex]?.id === project.id && !hoveredProject;

            return (
              <g key={project.id}>
                {(isActive || isAutoPlaying || project.isHQ) && (
                  <>
                    <circle
                      cx={project.coordinates[0]}
                      cy={project.coordinates[1]}
                      r={isActive ? 18 : (project.isHQ ? 16 : 14)}
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth={1.5}
                      opacity={0.3}
                    >
                      <animate
                        attributeName="r"
                        from={isActive ? 8 : (project.isHQ ? 7 : 6)}
                        to={isActive ? 24 : (project.isHQ ? 22 : 20)}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.6"
                        to="0"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                <g
                  onClick={() => handleMarkerClick(project)}
                  onMouseEnter={() => handleMarkerHover(project)}
                  onMouseLeave={handleMarkerLeave}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={project.coordinates[0]}
                    cy={project.coordinates[1]}
                    r={project.isHQ ? 6 : (isActive ? 5 : 3.5)}
                    fill={project.isHQ ? '#ffffff' : '#ff6b35'}
                    stroke={project.isHQ ? '#ff6b35' : 'none'}
                    strokeWidth={project.isHQ ? 2 : 0}
                    style={{
                      filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.9))' : 'none'
                    }}
                  >
                    {isAutoPlaying && !hoveredProject && (
                      <animate
                        attributeName="r"
                        values="3.5;5;3.5"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>

                  {project.isHQ && (
                    <text
                      x={project.coordinates[0]}
                      y={project.coordinates[1] - 12}
                      textAnchor="middle"
                      className="hq-label"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="Arial, sans-serif"
                    >
                      HQ
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </ComposableMap>

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
              <button className="tooltip-action" onClick={() => handleMarkerClick(hoveredProject)}>
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
