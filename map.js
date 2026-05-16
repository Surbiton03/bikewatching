// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

// Import D3 as an ESM module
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Check that Mapbox GL JS is loaded
console.log('Mapbox GL JS Loaded:', mapboxgl);

// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1Ijoic3VyYml0b24wMyIsImEiOiJjbXA3dnlrc2swODc3MnNweHFncGx2dXZxIn0.lOxlQESKqumf9Ds5_8FoMw';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map', // ID of the div where the map will render
  style: 'mapbox://styles/mapbox/streets-v12', // Map style
  center: [-71.09415, 42.36027], // [longitude, latitude]
  zoom: 12, // Initial zoom level
  minZoom: 5, // Minimum allowed zoom
  maxZoom: 18, // Maximum allowed zoom
});

// Define shared line style for bike lanes
const bikeLaneStyle = {
  'line-color': '#32D400', // Bright green
  'line-width': 5,         // Line thickness
  'line-opacity': 0.6,     // Transparency
};

// Select the SVG element inside the map container
const svg = d3.select('#map').select('svg');

// Helper function to convert station coordinates to pixel positions
function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.Long, +station.Lat); // Convert lon/lat to Mapbox LngLat
  const { x, y } = map.project(point); // Project to pixel coordinates
  return { cx: x, cy: y }; // Return as object for use in SVG attributes
}

// Wait for the map to fully load before adding data
map.on('load', async () => {
  // Add Boston bike lanes data source
  map.addSource('boston_route', {
    type: 'geojson',
    data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
  });

  // Add Boston bike lanes layer
  map.addLayer({
    id: 'boston-bike-lanes',
    type: 'line',
    source: 'boston_route',
    paint: bikeLaneStyle,
  });

  // Add Cambridge bike lanes data source
  map.addSource('cambridge_route', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson',
  });

  // Add Cambridge bike lanes layer
  map.addLayer({
    id: 'cambridge-bike-lanes',
    type: 'line',
    source: 'cambridge_route',
    paint: bikeLaneStyle,
  });

  // Fetch Bluebikes station data
  let jsonData;
  try {
    const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

    // Await JSON fetch
    jsonData = await d3.json(jsonurl);
    console.log('Loaded JSON Data:', jsonData); // Log to verify structure
  } catch (error) {
    console.error('Error loading JSON:', error); // Handle errors
  }

  // Access the stations array
  let stations = jsonData.data.stations;
  console.log('Stations Array:', stations);
  console.log('First station:', stations[0]);

  // Append circles to the SVG for each station
  const circles = svg
    .selectAll('circle')
    .data(stations)
    .enter()
    .append('circle')
    .attr('r', 5)              // Radius of the circle
    .attr('fill', 'steelblue') // Circle fill color
    .attr('stroke', 'white')   // Circle border color
    .attr('stroke-width', 1)   // Circle border thickness
    .attr('opacity', 0.8);     // Circle opacity

  // Function to update circle positions when the map moves/zooms
  function updatePositions() {
    circles
      .attr('cx', (d) => getCoords(d).cx) // Set x-position using projected coordinates
      .attr('cy', (d) => getCoords(d).cy); // Set y-position using projected coordinates
  }

  // Initial position update when map loads
  updatePositions();

  // Reposition markers on map interactions
  map.on('move', updatePositions);    // Update during map movement
  map.on('zoom', updatePositions);    // Update during zooming
  map.on('resize', updatePositions);  // Update on window resize
  map.on('moveend', updatePositions); // Final adjustment after movement ends
});