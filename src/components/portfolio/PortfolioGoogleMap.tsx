"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Map as MapIcon, ExternalLink } from "lucide-react";
import { type Building, healthColor, healthLabel, CLASS_META } from "@/lib/buildings/portfolio";

interface Props {
  buildings: Building[];
  height?: number;
  onSelect?: (b: Building) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}

const TORONTO = { lat: 43.7, lng: -79.42 };
const MAP_ID = "maia_buildings_map"; // Google Map ID for styling

// Custom retina-feeling map style that reads close to the rest of the app.
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "all",          elementType: "labels.text.fill",   stylers: [{ color: "#475569" }] },
  { featureType: "all",          elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 2 }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#CBD5E1" }] },
  { featureType: "landscape",    elementType: "geometry",           stylers: [{ color: "#F8FAFC" }] },
  { featureType: "poi",          stylers: [{ visibility: "off" }] },
  { featureType: "poi.park",     elementType: "geometry",           stylers: [{ color: "#ECFDF5" }] },
  { featureType: "road",         elementType: "geometry",           stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road",         elementType: "geometry.stroke",    stylers: [{ color: "#E2E8F0" }] },
  { featureType: "road.highway", elementType: "geometry",           stylers: [{ color: "#FEF3C7" }] },
  { featureType: "road.highway", elementType: "geometry.stroke",    stylers: [{ color: "#F59E0B" }, { weight: 0.5 }] },
  { featureType: "transit",      stylers: [{ visibility: "off" }] },
  { featureType: "water",        elementType: "geometry",           stylers: [{ color: "#DBEAFE" }] },
];

export function PortfolioGoogleMap({ buildings, height = 620, onSelect, hoveredId, onHover }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setLoadError("missing-key");
      return;
    }
    let cancelled = false;

    const loader = new Loader({ apiKey, version: "weekly" });

    loader
      .load()
      .then((google: typeof window.google) => {
        if (cancelled || !mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
          center: TORONTO,
          zoom: 10,
          minZoom: 8,
          maxZoom: 18,
          styles: MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
          backgroundColor: "#F8FAFC",
        });
        googleMapRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow({
          disableAutoPan: false,
          pixelOffset: new google.maps.Size(0, -8),
        });
        setReady(true);
      })
      .catch((err: Error) => {
        console.error("[google-maps]", err);
        setLoadError(err?.message ?? "Failed to load Google Maps");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Render/update markers when buildings change
  useEffect(() => {
    if (!ready || !googleMapRef.current) return;
    const map = googleMapRef.current;
    const infoWindow = infoWindowRef.current!;
    const existing = markersRef.current;
    const nextIds = new Set(buildings.map((b) => b.id));

    // Remove markers that are no longer in the filtered set
    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    });

    for (const b of buildings) {
      const color = healthColor(b.healthScore);
      const isHover = hoveredId === b.id;

      const svgMarker: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.9,
        strokeColor: "#FFFFFF",
        strokeWeight: isHover ? 3 : 2,
        scale: isHover ? 12 : 8,
      };

      let marker = existing.get(b.id);
      if (!marker) {
        marker = new google.maps.Marker({
          position: { lat: b.lat, lng: b.lng },
          map,
          title: b.name,
          icon: svgMarker,
          animation: b.healthScore < 55 ? google.maps.Animation.BOUNCE : null,
        });
        existing.set(b.id, marker);

        marker.addListener("click", () => {
          infoWindow.setContent(buildInfoHtml(b));
          infoWindow.open(map, marker);
          if (onSelect) onSelect(b);
        });
        marker.addListener("mouseover", () => {
          infoWindow.setContent(buildInfoHtml(b));
          infoWindow.open(map, marker);
          if (onHover) onHover(b.id);
        });
        marker.addListener("mouseout", () => {
          if (onHover) onHover(null);
        });
      } else {
        marker.setIcon(svgMarker);
      }
    }
  }, [buildings, ready, hoveredId, onSelect, onHover]);

  // Missing key → graceful explanation
  if (loadError === "missing-key") {
    return (
      <div
        className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.05))",
          border: "1px solid rgba(37,99,235,0.2)",
          minHeight: height,
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)" }}
        >
          <MapIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-[16px] font-bold text-[#0F172A] mb-1">Google Maps API key required</div>
        <div className="text-[12.5px] text-[#475569] max-w-md leading-relaxed mb-4">
          Add <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to
          the project&apos;s environment variables on Vercel, then redeploy.
        </div>
        <a
          href="https://console.cloud.google.com/google/maps-apis/start"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2563EB] hover:text-[#1D4ED8]"
        >
          Get a Google Maps API key <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="rounded-2xl p-10 text-center text-[13px] text-rose-600"
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", minHeight: height }}
      >
        Google Maps failed to load — {loadError}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="rounded-2xl overflow-hidden"
      style={{
        width: "100%",
        height,
        background: "#F8FAFC",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 2px 16px rgba(15,23,42,0.06)",
      }}
    />
  );
}

function buildInfoHtml(b: Building): string {
  const color = healthColor(b.healthScore);
  const cls = CLASS_META[b.class].label;
  return `
    <div style="font-family: Inter, system-ui, sans-serif; min-width: 260px; padding: 4px 6px;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:6px;">
        <div style="min-width:0;">
          <div style="font-size:13px; font-weight:700; color:#0F172A; line-height:1.2;">${escape(b.name)}</div>
          <div style="font-size:10.5px; color:#64748B; margin-top:2px;">${escape(b.address)} · ${escape(b.neighbourhood)}</div>
        </div>
        <div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;background:${color}1a;color:${color};border:1px solid ${color}55;">
          ${b.healthScore}
        </div>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:6px;">
        ${stat("Units", `${b.units}`)}
        ${stat("Occupancy", `${b.occupancyPct}%`)}
        ${stat("Open WOs", `${b.openWorkOrders}`, b.overdueWorkOrders > 0 ? "#F59E0B" : undefined)}
        ${stat("Arrears", `${b.arrearsTenants}`, b.arrearsTenants > 5 ? "#EF4444" : undefined)}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;">
        <span style="color:${color};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${healthLabel(b.healthScore)}</span>
        <span style="color:#64748B;">${escape(cls)}</span>
      </div>
      <a href="/building-detail?id=${b.id}" style="display:block; margin-top:8px; padding:6px 10px; border-radius:8px; background:linear-gradient(135deg, #2563EB, #7C3AED); color:#FFFFFF; font-size:11px; font-weight:700; text-align:center; text-decoration:none;">
        Open building →
      </a>
    </div>
  `;
}

function stat(label: string, value: string, valColor?: string): string {
  return `
    <div style="padding:4px 6px; background:rgba(15,23,42,0.03); border:1px solid rgba(15,23,42,0.06); border-radius:6px;">
      <div style="font-size:9px; color:#94A3B8; font-weight:600; text-transform:uppercase; letter-spacing:0.08em;">${label}</div>
      <div style="font-size:12px; font-weight:700; color:${valColor ?? "#0F172A"}; font-variant-numeric: tabular-nums;">${value}</div>
    </div>
  `;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}
