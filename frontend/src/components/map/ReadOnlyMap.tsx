"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface ReadOnlyMapProps {
  points: [number, number][];
}

function MapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);
  return null;
}

export default function ReadOnlyMap({ points }: ReadOnlyMapProps) {
  const center: [number, number] = points.length > 0 ? points[0] : [-6.2088, 106.8456];

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border">
      <MapContainer
        center={center}
        zoom={16}
        className="w-full h-full z-0 relative"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 0 && (
          <Polygon
            positions={points}
            pathOptions={{
              color: 'hsl(var(--primary))',
              fillColor: 'hsl(var(--primary))',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        )}
        {points.map((pos, idx) => (
          <Marker key={idx} position={pos} icon={icon} />
        ))}
        <MapBounds points={points} />
      </MapContainer>
    </div>
  );
}
