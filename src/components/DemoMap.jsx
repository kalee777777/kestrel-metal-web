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
    { id: 0, name: 'Kestrel Metal HQ', location: 'Anping, Hebei, China', type: 'Headquarters & Manufacturing', description: 'Global headquarters and main manufacturing campus in Anping - China\'s Wire Mesh Capital', capacity: '20,000 sqm', year: 2014, coordinates: [115.26, 38.22], isHQ: true },
    { id: 1, name: 'Shanghai Distribution Center', location: 'Shanghai, China', type: 'Regional Warehouse', description: 'Eastern China distribution hub for quick order fulfillment and logistics', capacity: '5,000 sqm', year: 2017, coordinates: [121.47, 31.23] },
    { id: 2, name: 'Guangzhou Export Terminal', location: 'Guangzhou, China', type: 'Export Shipping Hub', description: 'Southern China export terminal handling container shipments worldwide', capacity: '-', year: 2018, coordinates: [113.26, 23.13] },
    { id: 3, name: 'Beijing Project Office', location: 'Beijing, China', type: 'Project Coordination', description: 'Northern China project management and engineering coordination office', capacity: '-', year: 2019, coordinates: [116.40, 39.90] },
    { id: 4, name: 'Mumbai Fencing Supply', location: 'Mumbai, India', type: 'Fencing Supply Project', description: 'Large-scale security fencing supply for industrial and infrastructure projects', capacity: '50,000m', year: 2020, coordinates: [72.87, 19.07] },
    { id: 5, name: 'Delhi Airport Perimeter', location: 'Delhi, India', type: 'Airport Security Fencing', description: 'Airport perimeter security fencing installation with 3D wire panels', capacity: '12,000m', year: 2021, coordinates: [77.21, 28.61] },
    { id: 6, name: 'Dubai Industrial Fencing', location: 'Dubai, UAE', type: 'Industrial Fencing Project', description: 'Industrial facility perimeter fencing for manufacturing and logistics zones', capacity: '30,000m', year: 2019, coordinates: [55.27, 25.20] },
    { id: 7, name: 'Saudi Arabia Security Project', location: 'Riyadh, Saudi Arabia', type: 'High-Security Fencing', description: 'High-security fencing with razor wire for critical infrastructure protection', capacity: '25,000m', year: 2020, coordinates: [46.68, 24.71] },
    { id: 8, name: 'Istanbul Manufacturing Supply', location: 'Istanbul, Turkey', type: 'Wire Mesh Supply', description: 'Supply of welded wire mesh and chain link fencing for construction projects', capacity: '40,000m', year: 2018, coordinates: [28.97, 41.01] },
    { id: 9, name: 'Germany Distribution Hub', location: 'Hamburg, Germany', type: 'European Distribution', description: 'European distribution hub serving customers across the EU region', capacity: '-', year: 2016, coordinates: [10.00, 53.55] },
    { id: 10, name: 'UK Construction Supply', location: 'London, UK', type: 'Construction Wire Mesh', description: 'Construction reinforcement mesh supply for UK building projects', capacity: '15,000 tons', year: 2019, coordinates: [-0.13, 51.51] },
    { id: 11, name: 'France Agricultural Fencing', location: 'Paris, France', type: 'Agricultural Fencing', description: 'Farm and agricultural fencing supply for livestock and crop protection', capacity: '20,000m', year: 2020, coordinates: [2.35, 48.85] },
    { id: 12, name: 'Australia Farm Fencing', location: 'Sydney, Australia', type: 'Agricultural & Farm Fencing', description: 'Large-scale farm fencing for livestock protection in Australian rural areas', capacity: '100,000m', year: 2017, coordinates: [151.21, -33.87] },
    { id: 13, name: 'New Zealand Wire Supply', location: 'Auckland, New Zealand', type: 'Wire Products Distribution', description: 'Wire products and fencing distribution across New Zealand', capacity: '-', year: 2019, coordinates: [174.76, -36.85] },
    { id: 14, name: 'Brazil Construction Project', location: 'São Paulo, Brazil', type: 'Construction Mesh Supply', description: 'Construction wire mesh supply for Brazilian infrastructure projects', capacity: '25,000 tons', year: 2020, coordinates: [-46.63, -23.55] },
    { id: 15, name: 'Argentina Agricultural Supply', location: 'Buenos Aires, Argentina', type: 'Agricultural Fencing', description: 'Agricultural and farm fencing for livestock production in Argentina', capacity: '60,000m', year: 2018, coordinates: [-58.38, -34.60] },
    { id: 16, name: 'South Africa Mining Fencing', location: 'Johannesburg, South Africa', type: 'Mining Security Fencing', description: 'Mining site security fencing with anti-climb and razor wire systems', capacity: '35,000m', year: 2019, coordinates: [28.04, -26.20] },
    { id: 17, name: 'Kenya Infrastructure', location: 'Nairobi, Kenya', type: 'Infrastructure Fencing', description: 'Infrastructure project fencing for construction and utilities', capacity: '18,000m', year: 2021, coordinates: [36.82, -1.29] },
    { id: 18, name: 'Nigeria Perimeter Security', location: 'Lagos, Nigeria', type: 'Perimeter Security Fencing', description: 'Perimeter security fencing for commercial and industrial properties', capacity: '22,000m', year: 2020, coordinates: [3.38, 6.45] },
    { id: 19, name: 'Russia Industrial Fencing', location: 'Moscow, Russia', type: 'Industrial Fencing', description: 'Industrial facility fencing and wire mesh supply for Russian market', capacity: '50,000m', year: 2017, coordinates: [37.61, 55.75] },
    { id: 20, name: 'Canada Construction Mesh', location: 'Toronto, Canada', type: 'Construction Wire Mesh', description: 'Construction wire mesh and rebar products for Canadian building projects', capacity: '20,000 tons', year: 2019, coordinates: [-79.38, 43.65] },
    { id: 21, name: 'USA Fencing Distribution', location: 'Los Angeles, USA', type: 'Fencing Distribution Center', description: 'US West Coast distribution center for fencing and wire mesh products', capacity: '-', year: 2018, coordinates: [-118.24, 34.05] },
    { id: 22, name: 'Mexico Agricultural Supply', location: 'Mexico City, Mexico', type: 'Agricultural Fencing', description: 'Agricultural and livestock fencing supply for Mexican farms', capacity: '45,000m', year: 2021, coordinates: [-99.13, 19.43] }
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
            <p>From our headquarters in Anping, China, Kestrel Metal has successfully delivered fencing and wire mesh projects across 30+ countries worldwide.</p>
          </div>
          
          <div className="global-map-stats">
            <div className="stat-item">
              <span className="stat-num">200+</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">30+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">10+</span>
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
                    stroke="#FF6B00"
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
                        stroke="#FF6B00"
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
                        fill={project.isHQ ? '#ffffff' : '#FF6B00'}
                        stroke={project.isHQ ? '#FF6B00' : 'none'}
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
