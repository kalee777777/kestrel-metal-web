import { useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Building2, X } from 'lucide-react';
import './DemoMap.css';

const DemoMap = ({ onClose }) => {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const autoPlayRef = useRef(null);

  // 22个真实项目案例 - 使用真实经纬度坐标
  const projects = [
    {
      id: 0,
      name: 'Kestrel Metal Headquarters',
      location: 'Changsha, China',
      type: 'Corporate HQ & R&D Center',
      description: 'Global headquarters managing all international projects and operations since 2004',
      capacity: '-',
      year: 2004,
      coordinates: [112.94, 28.23],
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
      coordinates: [121.47, 31.23],
      isHQ: false
    },
    {
      id: 2,
      name: 'Yunnan Copper Electrowinning Complex',
      location: 'Kunming, Yunnan, China',
      type: 'Copper EW Project',
      description: 'Large-scale cathode copper production with SX-EW technology',
      capacity: '240,000 tpa',
      year: 2018,
      coordinates: [102.83, 25.04],
      isHQ: false
    },
    {
      id: 3,
      name: 'Guangxi Copper Refinery Upgrade',
      location: 'Nanning, Guangxi, China',
      type: 'Technology Modernization',
      description: 'Complete upgrade with advanced process control systems',
      capacity: '3,000 tpa',
      year: 2020,
      coordinates: [108.32, 22.82],
      isHQ: false
    },
    {
      id: 4,
      name: 'Zijin Mining Copper Smelter EPC',
      location: 'Longyan, Fujian, China',
      type: 'EPC Turnkey Project',
      description: 'Design, procurement, construction of integrated smelting facility',
      capacity: '300,000 tpa',
      year: 2019,
      coordinates: [117.03, 25.09],
      isHQ: false
    },
    {
      id: 5,
      name: 'Jiangxi Copper Cathode Technology',
      location: 'Nanchang, Jiangxi, China',
      type: 'Permanent Cathode Supply',
      description: 'Supply of stainless steel permanent cathode plates for electrowinning',
      capacity: '400,000 tpa',
      year: 2021,
      coordinates: [115.89, 28.68],
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
      coordinates: [111.75, 40.84],
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
      coordinates: [72.87, 19.07],
      isHQ: false
    },
    {
      id: 8,
      name: 'Jakarta Copper Smelter Expansion',
      location: 'Jakarta, Indonesia',
      type: 'Engineering & Procurement',
      description: 'Capacity expansion including furnace upgrade and automation system',
      capacity: '100,000 tpa',
      year: 2021,
      coordinates: [106.84, -6.21],
      isHQ: false
    },
    {
      id: 9,
      name: 'Ho Chi Minh City Copper Refinery',
      location: 'Ho Chi Minh City, Vietnam',
      type: 'Technical Consulting',
      description: 'Process optimization and technology transfer for refining operations',
      capacity: '20,000 tpa',
      year: 2022,
      coordinates: [106.70, 10.76],
      isHQ: false
    },
    {
      id: 10,
      name: 'Almaty Mining Equipment Supply',
      location: 'Almaty, Kazakhstan',
      type: 'Equipment Procurement',
      description: 'Supply chain management for mining equipment to Central Asia',
      capacity: '-',
      year: 2017,
      coordinates: [76.85, 43.22],
      isHQ: false
    },
    {
      id: 11,
      name: 'Hamburg European Operations Center',
      location: 'Hamburg, Germany',
      type: 'Regional Technical Hub',
      description: 'European base for technical support and client relations',
      capacity: '-',
      year: 2012,
      coordinates: [10.00, 53.55],
      isHQ: false
    },
    {
      id: 12,
      name: 'Warsaw WEEE Processing Technology',
      location: 'Warsaw, Poland',
      type: 'Technology License',
      description: 'Licensed proprietary copper recycling technology to Polish company',
      capacity: '2,000 tpa',
      year: 2016,
      coordinates: [21.01, 52.23],
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
      coordinates: [37.61, 55.75],
      isHQ: false
    },
    {
      id: 14,
      name: 'Istanbul Equipment Agency Services',
      location: 'Istanbul, Turkey',
      type: 'Procurement Agent',
      description: 'Strategic sourcing and quality inspection services for equipment',
      capacity: '-',
      year: 2020,
      coordinates: [28.97, 41.01],
      isHQ: false
    },
    {
      id: 15,
      name: 'Belgrade Copper Smelter Modernization',
      location: 'Belgrade, Serbia',
      type: 'Plant Revamp Project',
      description: 'Complete modernization of legacy smelter with environmental controls',
      capacity: '80,000 tpa',
      year: 2021,
      coordinates: [20.46, 44.79],
      isHQ: false
    },
    {
      id: 16,
      name: 'Santiago South America Support Center',
      location: 'Santiago, Chile',
      type: 'Regional Office & Projects',
      description: 'South American hub for mining projects support and management',
      capacity: '-',
      year: 2013,
      coordinates: [-70.65, -33.45],
      isHQ: false
    },
    {
      id: 17,
      name: 'Lima Copper Concentrator Project',
      location: 'Lima, Peru',
      type: 'Mining-Metallurgical Integration',
      description: 'Integrated concentrator and SX-EW facility for copper oxide ore',
      capacity: '50,000 tpa',
      year: 2017,
      coordinates: [-77.03, -12.05],
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
      coordinates: [-46.63, -23.55],
      isHQ: false
    },
    {
      id: 19,
      name: 'Toronto R&D Partnership Program',
      location: 'Toronto, Canada',
      type: 'Research Collaboration',
      description: 'Joint research program on advanced hydrometallurgical processes',
      capacity: '-',
      year: 2020,
      coordinates: [-79.38, 43.65],
      isHQ: false
    },
    {
      id: 20,
      name: 'Lubumbashi Cu-Co Hydrometallurgy Plant',
      location: 'Lubumbashi, DRC',
      type: 'Process Design & Commissioning',
      description: 'Copper-cobalt hydrometallurgical processing plant design and startup',
      capacity: '40,000 tpa',
      year: 2016,
      coordinates: [27.49, -11.66],
      isHQ: false
    },
    {
      id: 21,
      name: 'Kitwe Copper Smelter Construction',
      location: 'Kitwe, Zambia',
      type: 'EPC Project Management',
      description: 'EPC management for new copper smelter in Zambian Copperbelt',
      capacity: '120,000 tpa',
      year: 2018,
      coordinates: [28.20, -12.81],
      isHQ: false
    },
    {
      id: 22,
      name: 'Perth Laterite Nickel Technology Transfer',
      location: 'Perth, Australia',
      type: 'Technology Licensing',
      description: 'HPAL technology license for laterite nickel processing',
      capacity: '-',
      year: 2021,
      coordinates: [115.86, -31.95],
      isHQ: false
    }
  ];

  const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setAutoPlayIndex((prev) => (prev + 1) % projects.length);
    }, 3500);

    return () => clearInterval(autoPlayRef.current);
  }, []);

  const currentProject = hoveredProject || projects[autoPlayIndex];

  return (
    <div className="demo-map-overlay">
      <div className="demo-map-container">
        {/* Header */}
        <div className="demo-header">
          <div className="demo-title">
            <h1>🌍 react-simple-maps Professional Demo</h1>
            <p>Real geographic projection • Accurate country borders • 22 global projects</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Map */}
        <div className="map-wrapper">
          <ComposableMap
            projectionConfig={{
              rotate: [-10, 0, 0],
              scale: 180
            }}
            className="react-simple-maps-demo"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#2d3436"
                    stroke="#4a5568"
                    strokeWidth={0.5}
                    style={{
                      hover: {
                        fill: "#3d4548",
                        stroke: "#ff6b35",
                        strokeWidth: 1
                      }
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Connection line */}
            {currentProject && !currentProject.isHQ && (
              <path
                d={`M ${projects[0].coordinates[0]} ${projects[0].coordinates[1]} Q ${(projects[0].coordinates[0] + currentProject.coordinates[0]) / 2} ${(Math.min(projects[0].coordinates[1], currentProject.coordinates[1]) - 10)} ${currentProject.coordinates[0]} ${currentProject.coordinates[1]}`}
                fill="none"
                stroke="#ff6b35"
                strokeWidth={1.5}
                strokeDasharray="6,4"
                opacity={0.6}
              />
            )}

            {/* Markers */}
            {projects.map((project) => {
              const isActive = currentProject?.id === project.id;
              
              return (
                <g key={project.id}>
                  {/* Pulse ring */}
                  {(isActive || project.isHQ) && (
                    <circle
                      cx={project.coordinates[0]}
                      cy={project.coordinates[1]}
                      r={isActive ? 12 : (project.isHQ ? 10 : 0)}
                      fill="none"
                      stroke="#ff6b35"
                      strokeWidth={2}
                      opacity={0.5}
                    >
                      <animate
                        attributeName="r"
                        values={`${project.isHQ ? 5 : 3};${isActive ? 18 : 15};${project.isHQ ? 5 : 3}`}
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
                  )}

                  {/* Marker */}
                  <g
                    onMouseEnter={() => setHoveredProject(project)}
                    onMouseLeave={() => setHoveredProject(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={project.coordinates[0]}
                      cy={project.coordinates[1]}
                      r={project.isHQ ? 5 : (isActive ? 4 : 3)}
                      fill={project.isHQ ? '#ffffff' : '#ff6b35'}
                      stroke={project.isHQ ? '#ff6b35' : 'none'}
                      strokeWidth={project.isHQ ? 2 : 0}
                      style={{
                        filter: isActive ? 'drop-shadow(0 0 10px rgba(255, 107, 53, 0.9))' : 'none'
                      }}
                    />

                    {/* HQ Label */}
                    {project.isHQ && (
                      <text
                        x={project.coordinates[0]}
                        y={project.coordinates[1] - 12}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="700"
                        fontFamily="Arial, sans-serif"
                        style={{ 
                          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          pointerEvents: 'none'
                        }}
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
                className="map-tooltip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="tooltip-header">
                  <Building2 size={16} />
                  <span>{hoveredProject.location}</span>
                </div>
                <h3>{hoveredProject.name}</h3>
                <p className="type">{hoveredProject.type}</p>
                <p className="desc">{hoveredProject.description}</p>
                <div className="details">
                  <div className="row">
                    <span>Capacity</span>
                    <strong>{hoveredProject.capacity}</strong>
                  </div>
                  <div className="row">
                    <span>Year</span>
                    <strong>{hoveredProject.year}</strong>
                  </div>
                </div>
                <button className="action-btn">
                  View Details <ExternalLink size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Panel */}
        <div className="info-panel">
          <div className="stats-grid">
            <div className="stat">
              <div className="num">22</div>
              <div className="label">Projects</div>
            </div>
            <div className="stat">
              <div className="num">50+</div>
              <div className="label">Countries</div>
            </div>
            <div className="stat">
              <div className="num">20</div>
              <div className="label">Years</div>
            </div>
          </div>

          {!hoveredProject && (
            <motion.div
              className="auto-play-info"
              key={autoPlayIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h4>📍 {currentProject.name}</h4>
              <p>{currentProject.location} • {currentProject.year}</p>
            </motion.div>
          )}

          <div className="legend">
            <div className="legend-item">
              <span className="dot hq"></span> Headquarters
            </div>
            <div className="legend-item">
              <span className="dot active"></span> Active Project
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="demo-footer">
          <p><strong>Powered by react-simple-maps</strong> • Professional SVG mapping library</p>
          <p>Equal Earth projection • TopoJSON world data • Real geographic coordinates</p>
        </div>
      </div>
    </div>
  );
};

export default DemoMap;
