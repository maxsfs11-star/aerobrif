import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Sub-componente para forçar o mapa a focar na rota quando os dados mudarem
function RecenterMap({ origin, destination }) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      map.fitBounds([origin, destination], { padding: [50, 50] });
    }
  }, [origin, destination, map]);
  return null;
}

export function FlightMap({ origin, destination }) {
  if (!origin || !destination) return null;

  return (
    <MapContainer
      center={origin}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      {/* TileLayer em modo Light (Branco/Cinza claro) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
      />

      <RecenterMap origin={origin} destination={destination} />

      <Polyline
        positions={[origin, destination]}
        color="#22d3ee"
        weight={3}
        dashArray="10, 10"
      />

      <Marker position={origin}>
        <Popup>Origem</Popup>
      </Marker>

      <Marker position={destination}>
        <Popup>Destino</Popup>
      </Marker>
    </MapContainer>
  );
}
