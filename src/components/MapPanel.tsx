/**
 * MapPanel – renders a route between two addresses using MapVina GL.
 * Shown inline in the chat after the location agent node completes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Clock, Route, AlertTriangle, Loader2 } from 'lucide-react';
// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapPayload {
    origin: string;
    destination: string;
}

interface RouteInfo {
    distance: string;
    duration: string;
}

// ─── MapVina GL loader ────────────────────────────────────────────────────────

const MAPVINA_JS = 'https://unpkg.com/mapvina-gl@1.1.0/dist/mapvina-gl.js';
const MAPVINA_CSS = 'https://unpkg.com/mapvina-gl@1.1.0/dist/mapvina-gl.css';
const MAP_KEY = import.meta.env.VITE_MAP_KEY || '';

let sdkLoaded = false;
let sdkPromise: Promise<void> | null = null;

function loadMapVina(): Promise<void> {
    if (sdkLoaded) return Promise.resolve();
    if (sdkPromise) return sdkPromise;

    sdkPromise = new Promise((resolve, reject) => {
        // CSS
        if (!document.querySelector(`link[href="${MAPVINA_CSS}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = MAPVINA_CSS;
            document.head.appendChild(link);
        }

        // JS
        const script = document.createElement('script');
        script.src = MAPVINA_JS;
        script.onload = () => { sdkLoaded = true; resolve(); };
        script.onerror = () => reject(new Error('Failed to load MapVina GL'));
        document.head.appendChild(script);
    });

    return sdkPromise;
}

// ─── Polyline decoder ─────────────────────────────────────────────────────────

function decodePolyline(encoded: string): [number, number][] {
    let index = 0, lat = 0, lng = 0;
    const coords: [number, number][] = [];
    while (index < encoded.length) {
        let b: number, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);
        // API returns lat/lng swapped compared to GeoJSON [lng, lat]
        coords.push([lng / 1e5, lat / 1e5]);
    }
    return coords;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MapPanelProps {
    payload: MapPayload;
}

type Status = 'loading' | 'ready' | 'error';

export const MapPanel: React.FC<MapPanelProps> = ({ payload }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const [status, setStatus] = useState<Status>('loading');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                await loadMapVina();
                if (cancelled || !mapContainerRef.current) return;

                const mapvinagl = (window as any).mapvinagl;
                if (!mapvinagl) throw new Error('mapvinagl not available on window');

                const map = new mapvinagl.Map({
                    container: mapContainerRef.current,
                    style: `https://maps.mapvina.com/styles/v2/streets.json?key=${MAP_KEY}`,
                    center: { lat: 16.07, lng: 108.15 },
                    zoom: 11,
                });

                mapInstanceRef.current = map;

                map.on('load', async () => {
                    if (cancelled) return;

                    try {
                        const url =
                            `https://maps.mapvina.com/route/v2/directions/json` +
                            `?origin=${encodeURIComponent(payload.origin)}` +
                            `&destination=${encodeURIComponent(payload.destination)}` +
                            `&key=${MAP_KEY}`;

                        const res = await fetch(url);
                        const data = await res.json();

                        if (cancelled) return;

                        if (data.status !== 'OK' || !data.routes?.length) {
                            throw new Error(`Không tìm được đường: ${data.status ?? 'unknown'}`);
                        }

                        const leg = data.routes[0].legs[0];

                        // API quirk: start_location.lat is actually longitude
                        const startLng = leg.start_location.lat;
                        const startLat = leg.start_location.lng;
                        const endLng = leg.end_location.lat;
                        const endLat = leg.end_location.lng;

                        setRouteInfo({
                            distance: leg.distance?.text ?? '',
                            duration: leg.duration?.text ?? '',
                        });

                        // Origin marker (blue)
                        new mapvinagl.Marker({ color: '#3b82f6' })
                            .setLngLat([startLng, startLat])
                            .addTo(map);

                        // Destination marker (red)
                        new mapvinagl.Marker({ color: '#ef4444' })
                            .setLngLat([endLng, endLat])
                            .addTo(map);

                        // Draw polyline
                        const encoded = data.routes[0].overview_polyline?.points;
                        if (encoded) {
                            const decoded = decodePolyline(encoded);
                            map.addSource('route', {
                                type: 'geojson',
                                data: {
                                    type: 'Feature',
                                    properties: {},
                                    geometry: { type: 'LineString', coordinates: decoded },
                                },
                            });

                            map.addLayer({
                                id: 'route-casing',
                                type: 'line',
                                source: 'route',
                                paint: { 'line-color': '#1d4ed8', 'line-width': 8, 'line-opacity': 0.35 },
                            });

                            map.addLayer({
                                id: 'route-line',
                                type: 'line',
                                source: 'route',
                                paint: { 'line-color': '#3b82f6', 'line-width': 4 },
                            });
                        }

                        // Fit map to bounds
                        map.fitBounds(
                            [[startLng, startLat], [endLng, endLat]],
                            { padding: 60, maxZoom: 16 },
                        );

                        setStatus('ready');
                    } catch (err: any) {
                        if (!cancelled) {
                            setErrorMsg(err.message ?? 'Lỗi không xác định');
                            setStatus('error');
                        }
                    }
                });
            } catch (err: any) {
                if (!cancelled) {
                    setErrorMsg(err.message ?? 'Không thể tải thư viện bản đồ');
                    setStatus('error');
                }
            }
        }

        init();

        return () => {
            cancelled = true;
            if (mapInstanceRef.current) {
                try { mapInstanceRef.current.remove(); } catch { /* ignore */ }
                mapInstanceRef.current = null;
            }
        };
    }, [payload.origin, payload.destination]);

    return (
        <div className="map-panel-wrapper mt-4 rounded-2xl overflow-hidden border border-outline-variant/20 shadow-lg bg-surface-container-low">
            {/* Header with route info */}
            <div className="flex items-start gap-3 px-4 py-3 bg-surface-container border-b border-outline-variant/10">
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate font-medium text-on-surface">{payload.origin}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-secondary">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            <span className="truncate font-medium text-on-surface">{payload.destination}</span>
                        </span>
                    </div>
                </div>

                {routeInfo && (
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-secondary bg-surface-container-high px-2.5 py-1 rounded-lg">
                            <Route size={12} className="text-primary" />
                            <span className="font-semibold text-on-surface">{routeInfo.distance}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-secondary bg-surface-container-high px-2.5 py-1 rounded-lg">
                            <Clock size={12} className="text-primary" />
                            <span className="font-semibold text-on-surface">{routeInfo.duration}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Map container – always rendered so MapVina can mount */}
            <div className="relative" style={{ height: '340px' }}>
                <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

                {/* Loading overlay */}
                {status === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container-low/90 backdrop-blur-sm z-10">
                        <Loader2 size={28} className="text-primary animate-spin" />
                        <p className="text-sm text-secondary font-medium">Đang tải bản đồ...</p>
                    </div>
                )}

                {/* Error overlay */}
                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container-low/95 z-10 px-6 text-center">
                        <AlertTriangle size={28} className="text-red-400" />
                        <p className="text-sm font-medium text-on-surface">Không thể hiển thị bản đồ</p>
                        <p className="text-xs text-secondary">{errorMsg}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
