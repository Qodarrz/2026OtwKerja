"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

// Fix Leaflet marker icons
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  onAreaChange: (points: [number, number][], area: number) => void;
}

export default function MapPicker({ onAreaChange }: MapPickerProps) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const center: [number, number] = [-6.2088, 106.8456]; // Jakarta

  function MapEvents() {
    useMapEvents({
      click(e) {
        const newPoints: [number, number][] = [...points, [e.latlng.lat, e.latlng.lng]];
        setPoints(newPoints);
        calculateArea(newPoints);
      },
    });
    return null;
  }

  const calculateArea = (coords: [number, number][]) => {
    if (coords.length < 3) {
      onAreaChange(coords, 0);
      return;
    }
    
    // Simple Shoelace formula for area (approximate m2)
    // For more precision, we should use turf.js, but let's stick to a mock calculation for now
    // based on lat/lng differences scaled to meters
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i][1] * coords[j][0];
      area -= coords[j][1] * coords[i][0];
    }
    area = Math.abs(area) * 111319 * 111319 / 2; // Very rough conversion
    
    onAreaChange(coords, area);
  };

  const clearPoints = () => {
    setPoints([]);
    onAreaChange([], 0);
  };

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden border-2 border-border shadow-inner">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        
        {points.map((point, idx) => (
          <Marker key={idx} position={point} icon={icon} />
        ))}
        
        {points.length >= 2 && (
          <Polygon 
            positions={points} 
            pathOptions={{ 
              color: points.length >= 3 ? '#6366f1' : '#94a3b8',
              fillColor: '#818cf8',
              fillOpacity: 0.3,
              weight: 3,
              dashArray: points.length < 3 ? '5, 10' : ''
            }} 
          />
        )}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <div className="bg-background/90 backdrop-blur-md p-3 rounded-2xl border border-border shadow-lg flex flex-col gap-1 min-w-[150px]">
          <span className="text-xs font-bold text-muted-foreground uppercase">Info Lahan</span>
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-bold">{points.length}</span>
            <span className="text-xs text-muted-foreground">Titik</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2 h-8 text-xs rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              clearPoints();
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-md">
        <div className="bg-primary/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold opacity-80">Instruksi</span>
            <span className="text-sm font-medium">Klik pada peta untuk menentukan batas lahan</span>
          </div>
          {points.length >= 3 && (
            <div className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">
              Siap
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
