'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDashboard } from '../lib/store';
import 'leaflet/dist/leaflet.css';

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function TruckMap() {
  const { trucks, facilities, toggleAutofill } = useDashboard();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [selectedTruck, setSelectedTruck] = useState<string | null>('t1');
  const [mapReady, setMapReady] = useState(false);

  // 1. Initialize Map and Tile Layer ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return; // already initialized

      // Center map on US
      const map = L.map(mapContainerRef.current, {
        center: [40.5, -95.0],
        zoom: 4,
        zoomControl: true,
        attributionControl: true
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tile layer (Cached by browser)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Facility coordinates
      const facilityCoords: { [key: string]: [number, number] } = {
        f1: [41.8781, -87.6298], // Chicago
        f2: [40.7128, -74.0060], // NYC
        f3: [45.5152, -122.6784] // Portland
      };

      // Add Facility Markers
      facilities.forEach(fac => {
        const coords = facilityCoords[fac.id] || [40.0, -95.0];
        const totalStock = fac.inventory.reduce((a, b) => a + b.quantity, 0);
        const iconHtml = `
          <div style="
            background: ${fac.type === 'Warehouse' ? '#3b82f6' : fac.type === 'Store' ? '#10b981' : '#8b5cf6'};
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: 2px solid #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          ">
            ${fac.type === 'Warehouse' ? '🏭' : fac.type === 'Store' ? '🏬' : '🌿'}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'facility-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker(coords, { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="color: #0f172a; padding: 4px; min-width: 170px;">
            <strong style="font-size: 14px;">${fac.name}</strong><br/>
            <span style="font-size: 12px; color: #64748b;">Type: ${fac.type} • ${fac.location}</span><br/>
            <span style="font-size: 12px; color: #10b981; font-weight: 600;">Stock: ${formatNumber(totalStock)} units</span>
          </div>
        `);
      });

      // Draw Eco-Transit Route Polylines
      // Chicago -> NYC
      L.polyline([facilityCoords.f1, facilityCoords.f2], {
        color: '#10b981',
        weight: 3,
        opacity: 0.75,
        dashArray: '8, 8'
      }).addTo(map).bindTooltip('Zero-Emission Freight Corridor (Chicago ➔ NYC)');

      // Portland -> Chicago
      L.polyline([facilityCoords.f3, facilityCoords.f1], {
        color: '#3b82f6',
        weight: 2.5,
        opacity: 0.6,
        dashArray: '6, 6'
      }).addTo(map).bindTooltip('Vendor Ethical Inbound Line (Portland ➔ Chicago)');

      if (isMounted) {
        setMapReady(true);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run ONCE on mount

  // 2. Update Truck Markers smoothly without re-downloading map tiles
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const updateTruckMarkers = async () => {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      trucks.forEach(t => {
        const lat = t.lat || (t.id === 't1' ? 41.25 : t.id === 't2' ? 41.8781 : 45.5152);
        const lng = t.lng || (t.id === 't1' ? -80.50 : t.id === 't2' ? -87.6298 : -122.6784);

        const truckIconHtml = `
          <div style="
            background: ${t.status === 'In Transit' ? '#10b981' : t.status === 'Loading' ? '#f59e0b' : '#3b82f6'};
            color: #fff;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 2px solid #fff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            🚚
          </div>
        `;

        const popupHtml = `
          <div style="color: #0f172a; padding: 6px; min-width: 200px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 14px;">Truck ${t.id.toUpperCase()}</strong>
              <span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                ${t.status}
              </span>
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
              Powertrain: <strong>${t.fuelType || 'Electric (EV)'}</strong><br/>
              Load: <strong>${t.currentLoad} / ${t.capacity} Pallets (${Math.round((t.currentLoad / t.capacity) * 100)}%)</strong><br/>
              ${t.eta ? `ETA: <strong>${t.eta}</strong><br/>` : ''}
              Carbon Offset: <strong style="color: #16a34a;">+${t.co2SavedKg || 45.2} kg CO2</strong>
            </div>
          </div>
        `;

        if (markersRef.current[t.id]) {
          markersRef.current[t.id].setLatLng([lat, lng]);
          markersRef.current[t.id].setPopupContent(popupHtml);
        } else {
          const truckDivIcon = L.divIcon({
            html: truckIconHtml,
            className: 'truck-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          const truckMarker = L.marker([lat, lng], { icon: truckDivIcon }).addTo(map);
          truckMarker.bindPopup(popupHtml);
          truckMarker.on('click', () => setSelectedTruck(t.id));
          markersRef.current[t.id] = truckMarker;
        }
      });
    };

    updateTruckMarkers();
  }, [mapReady, trucks]);


  const activeTruck = trucks.find(t => t.id === selectedTruck) || trucks[0];

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🗺️</span>
            <h3 style={{ margin: 0 }}>Live Fleet Tracking (OpenStreetMap)</h3>
            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
              GPS Real-Time
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 2rem', fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
            Real-time delivery truck locations, route corridors, and zero-emission freight verification.
          </p>
        </div>

        {/* Selected Truck Stats Chip */}
        {activeTruck && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="glass-card" style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🚚</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>Focus: {activeTruck.id.toUpperCase()}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {activeTruck.fuelType || 'Electric (EV)'} • {activeTruck.status}
                </div>
              </div>
            </div>
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
              onClick={() => toggleAutofill(activeTruck.id)}
            >
              Autofill: {activeTruck.sustainableFillMode ? '✓ ON' : 'OFF'}
            </button>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div style={{
        position: 'relative',
        height: '420px',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
      }}>
        <div 
          ref={mapContainerRef} 
          style={{ height: '100%', width: '100%', background: '#090e17' }} 
        />

        {/* Map Legend Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          zIndex: 400
        }}>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Map Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            <span>In Transit (EV Route)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6' }} />
            <span>Central Warehouse</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
            <span>Retail Store</span>
          </div>
        </div>
      </div>

      {/* Truck Selection Cards below Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
        {trucks.map(truck => {
          const loadPct = Math.round((truck.currentLoad / truck.capacity) * 100);
          const isSelected = selectedTruck === truck.id;
          return (
            <div
              key={truck.id}
              onClick={() => setSelectedTruck(truck.id)}
              style={{
                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.25)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>TRUCK {truck.id.toUpperCase()}</strong>
                <span className={`badge ${truck.status === 'In Transit' ? 'badge-success' : truck.status === 'Loading' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                  {truck.status}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>
                {truck.fuelType || 'Electric (EV)'} • Load: {loadPct}% ({truck.currentLoad}/{truck.capacity} pallets)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>
                CO2 Saved: +{truck.co2SavedKg || 45.2} kg
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
