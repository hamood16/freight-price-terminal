from typing import Literal

from pydantic import BaseModel


MovementStatus = Literal["increase", "decrease", "stable", "unknown"]


class PortLocation(BaseModel):
    port: str
    country: str
    lat: float
    lng: float


class RoutePricing(BaseModel):
    current_price_per_kg: float
    previous_price_per_kg: float | None
    price_change_pct: float | None
    movement_status: MovementStatus


class ShippingRoute(BaseModel):
    route_id: str
    origin: PortLocation
    destination: PortLocation
    carrier: str
    service_type: str
    product_category: str
    container_type: str
    currency: str
    pricing: RoutePricing
    transit_days: int
    last_updated: str


class RouteDetailMetrics(BaseModel):
    reliability_pct: int
    average_transit_days: int
    delay_risk: str
    port_congestion_level: str
    sailings_per_week: int
    transshipment_count: int
    customs_complexity: str
    fuel_surcharge_risk: str
    weather_disruption_risk: str
    operational_note: str


class RouteDetailResponse(BaseModel):
    route: ShippingRoute
    details: RouteDetailMetrics
