import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalButton,
} from '../components/TerminalComponents';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

export default function NetworkMap() {
  const { caseId } = useParams<{ caseId: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const { data: entities, isLoading, refetch } = useQuery({
    queryKey: ['entities', caseId, 'location'],
    queryFn: () => api.getEntities(caseId!, 'location'),
    enabled: !!caseId,
  });

  useEffect(() => {
    if ((window as any).L) { setLeafletReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = (window as any).L;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([28.6, 77.2], 8);
    
    // Dark matter tiles for covert intelligence terminal
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    mapInstance.current = map;
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [leafletReady]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstance.current) return;
    const map = mapInstance.current;
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const towers = (entities || []).filter((e: any) => {
      const lat = e.attributes?.lat ?? e.attributes?.latitude;
      const lon = e.attributes?.lon ?? e.attributes?.longitude;
      return lat != null && lon != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon));
    });

    if (towers.length > 0) {
      const bounds: number[][] = [];
      towers.forEach((e: any) => {
        const lat = Number(e.attributes.lat ?? e.attributes.latitude);
        const lon = Number(e.attributes.lon ?? e.attributes.longitude);
        bounds.push([lat, lon]);
        const color = reviewColor(e.review_state);
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:2px;background:${color};border:1.5px solid #07100D;box-shadow:0 0 6px ${color}88"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([lat, lon], { icon, title: e.label })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;background:#07100D;color:#D8E5DC;padding:6px;border:1px solid #27453A;">
              <strong style="color:#FFB84D;">${e.label}</strong><br/>
              <span style="color:#6F887A;">TYPE:</span> ${e.entity_type}<br/>
              <span style="color:#6F887A;">LAT:</span> ${lat.toFixed(5)}<br/>
              <span style="color:#6F887A;">LON:</span> ${lon.toFixed(5)}<br/>
              <span style="color:#6F887A;">REVIEW:</span> ${e.review_state || 'new'}
            </div>`,
          );
      });
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
  }, [entities, leafletReady]);

  const towers = (entities || []).filter((e: any) => {
    const lat = e.attributes?.lat ?? e.attributes?.latitude;
    const lon = e.attributes?.lon ?? e.attributes?.longitude;
    return lat != null && lon != null;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="GEO-INT // 03"
        title="GEOSPATIAL & CELL TOWER NETWORK MAP"
        description="Coordinates and triangulated physical nodes mapped across cell sectors and geolocation tags."
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6F887A]">
            {isLoading
              ? '[ RESOLVING GEO-COORDINATES... ]'
              : `${towers.length} POSITIONED / ${entities?.length || 0} TOTAL`}
          </span>
          <TerminalButton variant="secondary" onClick={() => refetch()}>
            REFRESH MAP
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      <div className="relative flex-1 bg-[#07100D] border border-[#27453A] rounded-sm overflow-hidden my-2 min-h-0">
        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-xs text-[#FFB84D] bg-[#07100D]/80">
            [ LOADING MAP SATELLITE TILES... ]
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
        
        {towers.length === 0 && !isLoading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0B1713]/90 border border-[#27453A] rounded-xs px-4 py-2 text-xs text-[#6F887A]">
            NO GEOLOCATION ATTRIBUTES FOUND FOR CURRENT CASE RECORD SET.
          </div>
        )}

        <div className="absolute top-3 right-3 bg-[#0B1713]/95 border border-[#27453A] rounded-xs p-3 text-[10px] space-y-1.5 shadow-xl max-w-xs">
          <div className="font-bold text-[#FFB84D] border-b border-[#27453A] pb-1 uppercase tracking-wider">
            SECTOR STATUS
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#9FE3B1] inline-block border border-[#07100D]"></span>
            <span className="text-[#D8E5DC]">ACCEPTED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#E05A52] inline-block border border-[#07100D]"></span>
            <span className="text-[#D8E5DC]">REJECTED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FFB84D] inline-block border border-[#07100D]"></span>
            <span className="text-[#D8E5DC]">FLAGGED / DISPUTED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#6F887A] inline-block border border-[#07100D]"></span>
            <span className="text-[#D8E5DC]">NEW / PENDING VERIFICATION</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function reviewColor(state?: string): string {
  const s = (state || '').toLowerCase();
  if (s.includes('accept')) return '#9FE3B1';
  if (s.includes('reject')) return '#E05A52';
  if (s.includes('flag')) return '#FFB84D';
  return '#6F887A';
}