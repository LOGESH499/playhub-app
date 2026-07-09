"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapEventsProps {
  onPositionChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

function MapEvents({ onPositionChange, disabled }: MapEventsProps) {
  useMapEvents({
    click(event) {
      if (disabled) return;
      onPositionChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewSync({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);

  return null;
}

export interface VenueMapPickerInnerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
  className?: string;
}

export function VenueMapPickerInner({
  latitude,
  longitude,
  onChange,
  disabled,
  className,
}: VenueMapPickerInnerProps) {
  const centerLat = latitude ?? 19.076;
  const centerLng = longitude ?? 72.8777;
  const hasMarker = latitude != null && longitude != null;

  return (
    <div className={className}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={hasMarker ? 15 : 11}
        className="h-64 w-full rounded-md border z-0"
        scrollWheelZoom={!disabled}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onPositionChange={onChange} disabled={disabled} />
        {hasMarker && (
          <>
            <Marker position={[latitude, longitude]} icon={defaultIcon} />
            <MapViewSync latitude={latitude} longitude={longitude} />
          </>
        )}
      </MapContainer>
      <p className="mt-2 text-xs text-muted-foreground">
        Click the map to set the venue location. Uses OpenStreetMap tiles.
      </p>
    </div>
  );
}

export interface VenueMapPreviewInnerProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function VenueMapPreviewInner({
  latitude,
  longitude,
  className,
}: VenueMapPreviewInnerProps) {
  return (
    <div className={className}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        className="h-40 w-full rounded-md border z-0"
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={defaultIcon} />
      </MapContainer>
    </div>
  );
}
