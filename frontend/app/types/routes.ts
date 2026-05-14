export type MovementStatus = "increase" | "decrease" | "stable" | "unknown";

export type PortLocation = {
  port: string;
  country: string;
  lat: number;
  lng: number;
};

export type RoutePricing = {
  current_price_per_kg: number;
  previous_price_per_kg: number | null;
  price_change_pct: number | null;
  movement_status: MovementStatus;
};

export type ShippingRoute = {
  route_id: string;
  origin: PortLocation;
  destination: PortLocation;
  carrier: string;
  service_type: string;
  product_category: string;
  container_type: string;
  currency: string;
  pricing: RoutePricing;
  transit_days: number;
  last_updated: string;
};

export type RouteDetailMetrics = {
  reliability_pct: number;
  average_transit_days: number;
  delay_risk: string;
  port_congestion_level: string;
  sailings_per_week: number;
  transshipment_count: number;
  customs_complexity: string;
  fuel_surcharge_risk: string;
  weather_disruption_risk: string;
  operational_note: string;
};

export type RouteDetailResponse = {
  route: ShippingRoute;
  details: RouteDetailMetrics;
};

export type PortFilter = {
  country: string;
  port: string;
};

export type RouteFilters = {
  carrier: string;
  destination_ports: PortFilter[];
  product_category: string;
  movement_status: MovementStatus | "";
  origin_ports: PortFilter[];
};
