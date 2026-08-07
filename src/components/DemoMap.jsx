import { useState, useEffect, useRef, useMemo } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Building2, MapPin } from 'lucide-react';
import './DemoMap.css';

const DemoMap = () => {
  const [hoveredProject, setHoveredProject] = useState(null);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const [geoData, setGeoData] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const autoPlayRef = useRef(null);

  const projects = [
    { id: 0, name: 'Kestrel Metal Headquarters', location: 'Changsha, China', type: 'Corporate HQ & R&D Center', description: 'Global headquarters managing all international projects and operations since 2004', capacity: '-', year: 2004, coordinates: [112.94, 28.23], isHQ: true },
    { id: 1, name: 'Shanghai WEEE Copper Recycling Plant', location: 'Shanghai, China', type: 'E-Waste Recycling Facility', description: 'Advanced copper recovery from electronic waste using hydrometallurgical process', capacity: '5,000 tpa', year: 2015, coordinates: [121.47, 31.23] },
    { id: 2, name: 'Yunnan Copper Electrowinning Complex', location: 'Kunming, Yunnan, China', type: 'Copper EW Project', description: 'Large-scale cathode copper production with SX-EW technology', capacity: '240,000 tpa', year: 2018, coordinates: [102.83, 25.04] },
    { id: 3, name: 'Guangxi Copper Refinery Upgrade', location: 'Nanning, Guangxi, China', type: 'Technology Modernization', description: 'Complete upgrade with advanced process control systems', capacity: '3,000 tpa', year: 2020, coordinates: [108.32, 22.82] },
    { id: 4, name: 'Zijin Mining Copper Smelter EPC', location: 'Longyan, Fujian, China', type: 'EPC Turnkey Project', description: 'Design, procurement, construction of integrated smelting facility', capacity: '300,000 tpa', year: 2019, coordinates: [117.03, 25.09] },
    { id: 5, name: 'Jiangxi Copper Cathode Technology', location: 'Nanchang, Jiangxi, China', type: 'Permanent Cathode Supply', description: 'Supply of stainless steel permanent cathode plates for electrowinning', capacity: '400,000 tpa', year: 2021, coordinates: [115.89, 28.68] },
    { id: 6, name: 'Inner Mongolia Zinc-Lead Smelter', location: 'Hohhot, Inner Mongolia, China', type: 'Process Engineering', description: 'Comprehensive engineering design for zinc-lead smelting operations', capacity: '150,000 tpa', year: 2017, coordinates: [111.75, 40.84] },
    { id: 7, name: 'Mumbai Cathode Copper Facility', location: 'Mumbai, India', type: 'EPC Contract', description: 'Full EPC delivery of cathode copper production plant for Indian client', capacity: '6,000 tpa', year: 2019, coordinates: [72.87, 19.07] },
    { id: 8, name: 'Jakarta Copper Smelter Expansion', location: 'Jakarta, Indonesia', type: 'Engineering & Procurement', description: 'Capacity expansion including furnace upgrade and automation system', capacity: '100,000 tpa', year: 2021, coordinates: [106.84, -6.21] },
    { id: 9, name: 'Ho Chi Minh City Copper Refinery', location: 'Ho Chi Minh City, Vietnam', type: 'Technical Consulting', description: 'Process optimization and technology transfer for refining operations', capacity: '20,000 tpa', year: 2022, coordinates: [106.70, 10.76] },
    { id: 10, name: 'Almaty Mining Equipment Supply', location: 'Almaty, Kazakhstan', type: 'Equipment Procurement', description: 'Supply chain management for mining equipment to Central Asia', capacity: '-', year: 2017, coordinates: [76.85, 43.22] },
    { id: 11, name: 'Hamburg European Operations Center', location: 'Hamburg, Germany', type: 'Regional Technical Hub', description: 'European base for technical support and client relations', capacity: '-', year: 2012, coordinates: [10.00, 53.55] },
    { id: 12, name: 'Warsaw WEEE Processing Technology', location: 'Warsaw, Poland', type: 'Technology License', description: 'Licensed proprietary copper recycling technology to Polish company', capacity: '2,000 tpa', year: 2016, coordinates: [21.01, 52.23] },
    { id: 13, name: 'Moscow Non-Ferrous Metallurgy Design', location: 'Moscow, Russia', type: 'Engineering Design', description: 'Detailed engineering design for non-ferrous metals processing facility', capacity: '-', year: 2018, coordinates: [37.61, 55.75] },
    { id: 14, name: 'Istanbul Equipment Agency Services', location: 'Istanbul, Turkey', type: 'Procurement Agent', description: 'Strategic sourcing and quality inspection services for equipment', capacity: '-', year: 2020, coordinates: [28.97, 41.01] },
    { id: 15, name: 'Belgrade Copper Smelter Modernization', location: 'Belgrade, Serbia', type: 'Plant Revamp Project', description: 'Complete modernization of legacy smelter with environmental controls', capacity: '80,000 tpa', year: 2021, coordinates: [20.46, 44.79] },
    { id: 16, name: 'Santiago South America Support Center', location: 'Santiago, Chile', type: 'Regional Office & Projects', description: 'South American hub for mining projects support and management', capacity: '-', year: 2013, coordinates: [-70.65, -33.45] },
    { id: 17, name: 'Lima Copper Concentrator Project', location: 'Lima, Peru', type: 'Mining-Metallurgical Integration', description: 'Integrated concentrator and SX-EW facility for copper oxide ore', capacity: '50,000 tpa', year: 2017, coordinates: [-77.03, -12.05] },
    { id: 18, name: 'São Paulo Electronic Waste Recycling', location: 'São Paulo, Brazil', type: 'Full Plant Delivery', description: 'Turnkey e-waste recycling plant with precious metals recovery capability', capacity: '8,000 tpa', year: 2019, coordinates: [-46.63, -23.55] },
    { id: 19, name: 'Toronto R&D Partnership Program', location: 'Toronto, Canada', type: 'Research Collaboration', description: 'Joint research program on advanced hydrometallurgical processes', capacity: '-', year: 2020, coordinates: [-79.38, 43.65] },
    { id: 20, name: 'Lubumbashi Cu-Co Hydrometallurgy Plant', location: 'Lubumbashi, DRC', type: 'Process Design & Commissioning', description: 'Copper-cobalt hydrometallurgical processing plant design and startup', capacity: '40,000 tpa', year: 2016, coordinates: [27.49, -11.66] },
    { id: 21, name: 'Kitwe Copper Smelter Construction', location: 'Kitwe, Zambia', type: 'EPC Project Management', description: 'EPC management for new copper smelter in Zambian Copperbelt', capacity: '120,000 tpa', year: 2018, coordinates: [28.20, -12.81] },
    { id: 22, name: 'Perth Laterite Nickel Technology Transfer', location: 'Perth, Australia', type: 'Technology Licensing', description: 'HPAL technology license for laterite nickel processing', capacity: '-', year: 2021, coordinates: [115.86, -31.95] }
  ];

  const width = 900;
  const height = 460;

  const projection = useMemo(() => {
    const proj = geoNaturalEarth1()
      .scale(165)
      .translate([width / 2, height / 2 + 20]);
    return proj;
  }, []);

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load map data');
        return res.json();
      })
      .then((topology) => {
        const geoJson = feature(topology, topology.objects.countries);
        setGeoData(geoJson);
      })
      .catch((err) => setGeoError(err.message));

    autoPlayRef.current = setInterval(() => {
      setAutoPlayIndex((prev) => (prev + 1) % projects.length);
    }, 3500);

    return () => clearInterval(autoPlayRef.current);
  }, []);

  const currentProject = hoveredProject || projects[autoPlayIndex];
  const graticulePath = useMemo(() => pathGen(geoGraticule10()), [pathGen]);

  const projectToXY = (coords) => projection(coords);

  return (
    <section id="global" className="global-map-section">
      <div className="global-map-container">
        <div className="global-map-header">
          <div className="global-map-title">
            <span className="section-tag">GLOBAL PRESENCE</span>
            <h2>Worldwide Project Network</h2>
            <p>From our headquarters in Changsha, China, Kestrel Metal has successfully delivered 22 major metallurgical projects across 50+ countries worldwide.</p>
          </div>
          
          <div className="global-map-stats">
            <div className="stat-item">
              <span className="stat-num">22</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">50+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">20</span>
              <span className="stat-label">Years</span>
            </div>
          </div>
        </div>

        <div className="global-map-content">
          <div className="map-visualization">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="world-map-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="#1a2332" />
                  <stop offset="100%" stopColor="#0f1420" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width={width} height={height} fill="url(#ocean-gradient)" />

              {graticulePath && (
                <path
                  d={graticulePath}
                  fill="none"
                  stroke="#2a3545"
                  strokeWidth="0.5"
                  strokeDasharray="2,3"
                />
              )}

              {geoData && geoData.features ? (
                geoData.features.map((geo, i) => {
                  const d = pathGen(geo);
                  if (!d) return null;
                  return (
                    <path
                      key={i}
                      d={d}
                      fill="#2d3436"
                      stroke="#4a5568"
                      strokeWidth={0.4}
                      className="country-path"
                    />
                  );
                })
              ) : geoError ? (
                <text x={width / 2} y={height / 2} fill="#ff6b6b" textAnchor="middle" fontSize="16">
                  Failed to load map: {geoError}
                </text>
              ) : (
                <text x={width / 2} y={height / 2} fill="#888" textAnchor="middle" fontSize="14">
                  Loading world map...
                </text>
              )}

              {geoData && currentProject && !currentProject.isHQ && (() => {
                const hqXY = projectToXY(projects[0].coordinates);
                const targetXY = projectToXY(currentProject.coordinates);
                if (!hqXY || !targetXY) return null;
                const midX = (hqXY[0] + targetXY[0]) / 2;
                const midY = Math.min(hqXY[1], targetXY[1]) - 40;
                return (
                  <path
                    d={`M ${hqXY[0]} ${hqXY[1]} Q ${midX} ${midY} ${targetXY[0]} ${targetXY[1]}`}
                    fill="none"
                    stroke="#ff6b35"
                    strokeWidth={1.5}
                    strokeDasharray="6,4"
                    opacity={0.7}
                  />
                );
              })()}

              {projects.map((project) => {
                const xy = projectToXY(project.coordinates);
                if (!xy) return null;
                const [cx, cy] = xy;
                const isActive = currentProject?.id === project.id;
                const r = project.isHQ ? 5 : (isActive ? 4 : 2.8);

                return (
                  <g key={project.id}>
                    {(isActive || project.isHQ) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? 14 : (project.isHQ ? 12 : 0)}
                        fill="none"
                        stroke="#ff6b35"
                        strokeWidth={1.5}
                        opacity={0.6}
                      >
                        <animate
                          attributeName="r"
                          values={`${project.isHQ ? 5 : 3};${isActive ? 20 : 16};${project.isHQ ? 5 : 3}`}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.7;0;0.7"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    <g
                      onMouseEnter={() => setHoveredProject(project)}
                      onMouseLeave={() => setHoveredProject(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={project.isHQ ? '#ffffff' : '#ff6b35'}
                        stroke={project.isHQ ? '#ff6b35' : 'none'}
                        strokeWidth={project.isHQ ? 2 : 0}
                        filter={isActive ? 'url(#glow)' : 'none'}
                      />

                      {project.isHQ && (
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="700"
                          fontFamily="Arial, sans-serif"
                          style={{ pointerEvents: 'none' }}
                        >
                          HQ
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>

            <AnimatePresence>
              {hoveredProject && (
                <motion.div
                  className="map-tooltip"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="tooltip-header">
                    <MapPin size={16} />
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

          <div className="map-info-panel">
            <div className="panel-header">
              <span className="panel-label">Currently Highlighting</span>
            </div>

            {!hoveredProject && currentProject && (
              <motion.div
                className="project-highlight"
                key={autoPlayIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3>{currentProject.name}</h3>
                <p className="project-location">{currentProject.location}</p>
                <div className="project-meta">
                  <span className="meta-tag">{currentProject.type}</span>
                  <span className="meta-tag">{currentProject.year}</span>
                </div>
                <p className="project-desc">{currentProject.description}</p>
              </motion.div>
            )}

            <div className="panel-legend">
              <div className="legend-item">
                <span className="legend-dot hq"></span>
                <span>Headquarters</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot active"></span>
                <span>Active Project</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoMap;
