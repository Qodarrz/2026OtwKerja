"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import * as turf from "@turf/turf";
import { Loader2 } from "lucide-react";

// Fix Leaflet marker icons
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  onAreaChange: (points: [number, number][], area: number, addressDetails?: any) => void;
}

export default function MapPicker({ onAreaChange }: MapPickerProps) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const center: [number, number] = [-6.2088, 106.8456]; // Jakarta

  function MapEvents() {
    useMapEvents({
      click(e) {
        const newPoints: [number, number][] = [...points, [e.latlng.lat, e.latlng.lng]];
        setPoints(newPoints);
        calculateAreaAndFetchAddress(newPoints);
      },
    });
    return null;
  }

  const calculateAreaAndFetchAddress = async (coords: [number, number][]) => {
    if (coords.length < 3) {
      onAreaChange(coords, 0);
      return;
    }

    // Accurate area calculation using Turf.js
    // Turf requires [longitude, latitude] format and closed polygon
    const turfCoords = [...coords.map(c => [c[1], c[0]]), [coords[0][1], coords[0][0]]];
    const polygon = turf.polygon([turfCoords]);
    const area = turf.area(polygon);

    setIsGeocoding(true);
    try {
      // Reverse Geocoding using Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0][0]}&lon=${coords[0][1]}`);
      const data = await res.json();

      const addressDetails = {
        road: data.address?.road || '',
        suburb: data.address?.suburb || data.address?.village || data.address?.neighbourhood || '',
        city: data.address?.city || data.address?.county || data.address?.town || '',
        state: data.address?.state || '',
        postcode: data.address?.postcode || '',
        full: data.display_name
      };

      onAreaChange(coords, area, addressDetails);
    } catch (e) {
      console.error("Reverse geocoding failed", e);
      onAreaChange(coords, area, null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const clearPoints = () => {
    setPoints([]);
    onAreaChange([], 0);
  };

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden border-2 border-border shadow-inner bg-muted">
      <MapContainer
        center={center}
        zoom={16}
        maxZoom={22}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; Google'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          maxZoom={22}
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

      <div className="absolute top-4 right-4 z-400 flex flex-col gap-2">
        <div className="bg-background/90 backdrop-blur-md p-3 rounded-2xl border border-border shadow-lg flex flex-col gap-1 min-w-37.5">
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

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-400 w-[90%] max-w-md">
        <div className="bg-primary/90 backdrop-blur-md text-primary-foreground p-4 rounded-2xl shadow-lg flex items-center justify-between border border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold opacity-80">Instruksi</span>
            <span className="text-sm font-medium">Klik pada peta untuk batas presisi tinggi</span>
          </div>
          {points.length >= 3 && (
            <div className="px-3 py-1 bg-card/20 rounded-lg text-xs font-bold flex items-center gap-2">
              {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : "Akurat"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
