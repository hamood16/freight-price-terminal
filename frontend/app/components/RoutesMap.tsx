"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { RouteHoverTooltip } from "./RouteHoverTooltip";
import type { MovementStatus, ShippingRoute } from "../types/routes";

type RoutesMapProps = {
  routes: ShippingRoute[];
};

const MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json";
const KNOWN_SOURCE_ID = "known-routes";
const UNKNOWN_SOURCE_ID = "unknown-routes";
const KNOWN_LAYER_ID = "known-route-lines";
const UNKNOWN_LAYER_ID = "unknown-route-lines";
const KNOWN_HITBOX_LAYER_ID = "known-route-hitbox";
const UNKNOWN_HITBOX_LAYER_ID = "unknown-route-hitbox";

const lineColors: Record<MovementStatus, string> = {
  increase: "#dc2626",
  decrease: "#059669",
  stable: "#71717a",
  unknown: "#71717a",
};

export function RoutesMap({ routes }: RoutesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const routesRef = useRef(routes);
  const [hoveredRoute, setHoveredRoute] = useState<{
    left: number;
    route: ShippingRoute;
    top: number;
  } | null>(null);

  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: [15, 20],
      zoom: 1.2,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    mapRef.current = map;

    const resizeMap = () => {
      map.resize();
    };
    const resizeObserver = new ResizeObserver(resizeMap);

    resizeObserver.observe(mapContainerRef.current);
    map.once("load", resizeMap);
    window.requestAnimationFrame(resizeMap);
    window.setTimeout(resizeMap, 100);

    return () => {
      resizeObserver.disconnect();
      map.off("load", resizeMap);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const showTooltip = (event: maplibregl.MapLayerMouseEvent) => {
      const routeId = event.features?.[0]?.properties?.route_id;

      if (typeof routeId !== "string") {
        return;
      }

      const route = routesRef.current.find(
        (currentRoute) => currentRoute.route_id === routeId,
      );

      if (!route) {
        return;
      }

      map.getCanvas().style.cursor = "pointer";
      setHoveredRoute({
        left: event.point.x,
        route,
        top: event.point.y,
      });
    };

    const hideTooltip = () => {
      map.getCanvas().style.cursor = "";
      setHoveredRoute(null);
    };

    const renderRoutes = () => {
      map.resize();
      removeRouteLayers(map);

      const knownRoutes = routes.filter(
        (route) => route.pricing.movement_status !== "unknown",
      );
      const unknownRoutes = routes.filter(
        (route) => route.pricing.movement_status === "unknown",
      );

      map.addSource(KNOWN_SOURCE_ID, {
        type: "geojson",
        data: buildRouteFeatureCollection(knownRoutes),
      });
      map.addSource(UNKNOWN_SOURCE_ID, {
        type: "geojson",
        data: buildRouteFeatureCollection(unknownRoutes),
      });

      map.addLayer({
        id: KNOWN_LAYER_ID,
        type: "line",
        source: KNOWN_SOURCE_ID,
        paint: {
          "line-color": [
            "match",
            ["get", "movement_status"],
            "increase",
            lineColors.increase,
            "decrease",
            lineColors.decrease,
            "stable",
            lineColors.stable,
            lineColors.unknown,
          ],
          "line-width": 2,
          "line-opacity": 0.85,
        },
      });

      map.addLayer({
        id: UNKNOWN_LAYER_ID,
        type: "line",
        source: UNKNOWN_SOURCE_ID,
        paint: {
          "line-color": lineColors.unknown,
          "line-dasharray": [2, 2],
          "line-width": 2,
          "line-opacity": 0.75,
        },
      });

      map.addLayer({
        id: KNOWN_HITBOX_LAYER_ID,
        type: "line",
        source: KNOWN_SOURCE_ID,
        paint: {
          "line-color": "#000000",
          "line-opacity": 0,
          "line-width": 14,
        },
      });

      map.addLayer({
        id: UNKNOWN_HITBOX_LAYER_ID,
        type: "line",
        source: UNKNOWN_SOURCE_ID,
        paint: {
          "line-color": "#000000",
          "line-opacity": 0,
          "line-width": 14,
        },
      });

      map.on("mousemove", KNOWN_HITBOX_LAYER_ID, showTooltip);
      map.on("mousemove", UNKNOWN_HITBOX_LAYER_ID, showTooltip);
      map.on("mouseleave", KNOWN_HITBOX_LAYER_ID, hideTooltip);
      map.on("mouseleave", UNKNOWN_HITBOX_LAYER_ID, hideTooltip);

      fitMapToRoutes(map, routes);
    };

    if (map.isStyleLoaded()) {
      renderRoutes();
    } else {
      map.once("load", renderRoutes);
    }

    return () => {
      map.off("load", renderRoutes);
      map.off("mousemove", KNOWN_HITBOX_LAYER_ID, showTooltip);
      map.off("mousemove", UNKNOWN_HITBOX_LAYER_ID, showTooltip);
      map.off("mouseleave", KNOWN_HITBOX_LAYER_ID, hideTooltip);
      map.off("mouseleave", UNKNOWN_HITBOX_LAYER_ID, hideTooltip);
      hideTooltip();
    };
  }, [routes]);

  return (
    <section className="route-map-shell min-h-0 rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm">
      <div ref={mapContainerRef} className="route-map-viewport" />
      <div className="absolute left-4 top-4 z-10 rounded-lg border border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-xs font-medium uppercase text-zinc-500">
          Route movement
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-700">
          <LegendItem color={lineColors.increase} label="Increase" />
          <LegendItem color={lineColors.decrease} label="Decrease" />
          <LegendItem color={lineColors.stable} label="Stable" />
          <LegendItem color={lineColors.unknown} dashed label="Unknown" />
        </div>
      </div>
      {hoveredRoute ? (
        <RouteHoverTooltip
          left={hoveredRoute.left}
          route={hoveredRoute.route}
          top={hoveredRoute.top}
        />
      ) : null}
    </section>
  );
}

function LegendItem({
  color,
  dashed = false,
  label,
}: {
  color: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-0.5 w-7 ${dashed ? "border-t-2 border-dashed bg-transparent" : ""}`}
        style={{ backgroundColor: dashed ? "transparent" : color, borderColor: color }}
      />
      {label}
    </span>
  );
}

function buildRouteFeatureCollection(routes: ShippingRoute[]) {
  return {
    type: "FeatureCollection" as const,
    features: routes.map((route) => ({
      type: "Feature" as const,
      properties: {
        route_id: route.route_id,
        movement_status: route.pricing.movement_status,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [route.origin.lng, route.origin.lat],
          [route.destination.lng, route.destination.lat],
        ],
      },
    })),
  };
}

function removeRouteLayers(map: maplibregl.Map) {
  for (const layerId of [
    KNOWN_HITBOX_LAYER_ID,
    UNKNOWN_HITBOX_LAYER_ID,
    KNOWN_LAYER_ID,
    UNKNOWN_LAYER_ID,
  ]) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  for (const sourceId of [KNOWN_SOURCE_ID, UNKNOWN_SOURCE_ID]) {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  }
}

function fitMapToRoutes(map: maplibregl.Map, routes: ShippingRoute[]) {
  if (routes.length === 0) {
    return;
  }

  const bounds = new maplibregl.LngLatBounds();

  for (const route of routes) {
    bounds.extend([route.origin.lng, route.origin.lat]);
    bounds.extend([route.destination.lng, route.destination.lat]);
  }

  map.fitBounds(bounds, {
    padding: 70,
    maxZoom: 3.2,
    duration: 800,
  });
}
