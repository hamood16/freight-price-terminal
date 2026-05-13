from pathlib import Path
from typing import Any

import pandas as pd

from app.schemas import MovementStatus, ShippingRoute


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "routes.csv"


def calculate_price_change_pct(
    current_price: float,
    previous_price: float | None,
) -> float | None:
    if previous_price is None or previous_price == 0:
        return None

    return round(((current_price - previous_price) / previous_price) * 100, 2)


def calculate_movement_status(
    current_price: float,
    previous_price: float | None,
) -> MovementStatus:
    if previous_price is None or previous_price == 0:
        return "unknown"
    if current_price > previous_price:
        return "increase"
    if current_price < previous_price:
        return "decrease"
    return "stable"


def get_routes(filters: dict[str, str | None] | None = None) -> list[ShippingRoute]:
    routes_df = pd.read_csv(DATA_PATH)

    if filters:
        routes_df = _apply_filters(routes_df, filters)

    return [_row_to_route(row) for row in routes_df.to_dict(orient="records")]


def _apply_filters(
    routes_df: pd.DataFrame,
    filters: dict[str, str | None],
) -> pd.DataFrame:
    filtered_df = routes_df

    for column_name, filter_value in filters.items():
        if not filter_value:
            continue

        filtered_df = filtered_df[
            filtered_df[column_name].astype(str).str.casefold()
            == filter_value.casefold()
        ]

    return filtered_df


def _row_to_route(row: dict[str, Any]) -> ShippingRoute:
    current_price = float(row["current_price_per_kg"])
    previous_price = _optional_float(row["previous_price_per_kg"])

    return ShippingRoute(
        route_id=row["route_id"],
        origin={
            "port": row["origin_port"],
            "country": row["origin_country"],
            "lat": float(row["origin_lat"]),
            "lng": float(row["origin_lng"]),
        },
        destination={
            "port": row["destination_port"],
            "country": row["destination_country"],
            "lat": float(row["destination_lat"]),
            "lng": float(row["destination_lng"]),
        },
        carrier=row["carrier"],
        service_type=row["service_type"],
        product_category=row["product_category"],
        container_type=row["container_type"],
        currency=row["currency"],
        pricing={
            "current_price_per_kg": current_price,
            "previous_price_per_kg": previous_price,
            "price_change_pct": calculate_price_change_pct(
                current_price,
                previous_price,
            ),
            "movement_status": calculate_movement_status(
                current_price,
                previous_price,
            ),
        },
        transit_days=int(row["transit_days"]),
        last_updated=row["last_updated"],
    )


def _optional_float(value: Any) -> float | None:
    if pd.isna(value):
        return None

    return float(value)
