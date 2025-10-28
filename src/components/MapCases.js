import React from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import { DivIcon } from "leaflet";

// Example data: city, lat, lon, and case count
const CASE_LOCATIONS = [
  { city: "Dubai",      lat: 25.276987, lon: 55.296249, count: 1 },
  { city: "Abu Dhabi",  lat: 24.453884, lon: 54.3773438, count: 2 },
  { city: "Sharjah",    lat: 25.346255, lon: 55.420932, count: 2 },
  { city: "Al Ain",     lat: 24.2075,   lon: 55.7447,   count: 3 },
];

// Helper to render a round number badge as a marker icon
function numberBadge(count) {
  return new DivIcon({
    className: "", // prevent default leaflet marker styles
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:34px;height:34px;border-radius:9999px;
        background:#019348;color:white;font-weight:700;font-size:14px;
        box-shadow:0 4px 10px rgba(0,0,0,0.15);
        border:2px solid rgba(255,255,255,0.9);
      ">
        ${count}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17], // center the badge
  });
}

export default function MapCases() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">Cases on Map</h3>

      <div className="rounded-lg overflow-hidden" style={{ height: 260 }}>
        <MapContainer
          center={[24.5, 54.4]} // roughly UAE center
          zoom={8}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {CASE_LOCATIONS.map((loc, idx) => (
            <Marker
              key={idx}
              position={[loc.lat, loc.lon]}
              icon={numberBadge(loc.count)}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-sm font-semibold">{loc.city}</div>
                <div className="text-xs text-gray-600">{loc.count} case(s)</div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
