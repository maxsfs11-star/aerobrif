import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function ChangeView({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]); // <--- Adicione o 'map' aqui dentro!

  return null;
}

export function FlightMap({ coordsOrigin, coordsDest }) {
  const defaultPos = [-15.78, -47.92];

  // Criamos os limites do mapa para mostrar os dois aeroportos ao mesmo tempo
  const bounds = coordsOrigin && coordsDest ? [coordsOrigin, coordsDest] : null;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden">
      <MapContainer center={defaultPos} zoom={4} className="h-full w-full">
        {bounds && <ChangeView bounds={bounds} />}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {coordsOrigin && (
          <Marker position={coordsOrigin}>
            <Popup>Origem: {coordsOrigin.join(", ")}</Popup>
          </Marker>
        )}

        {coordsDest && (
          <Marker position={coordsDest}>
            <Popup>Destino: {coordsDest.join(", ")}</Popup>
          </Marker>
        )}

        {/* A LINHA DE ROTA */}
        {coordsOrigin && coordsDest && (
          <Polyline
            positions={[coordsOrigin, coordsDest]}
            color="#06b6d4" // Cor Cyan do seu tema
            weight={3}
            dashArray="10, 10" // Linha tracejada estilo aviação
          />
        )}
      </MapContainer>
    </div>
  );
}
