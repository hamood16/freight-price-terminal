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


FilterValue = str | list[str] | None


def get_routes(filters: dict[str, FilterValue] | None = None) -> list[ShippingRoute]:
    routes_df = pd.read_csv(DATA_PATH)
    movement_status_filter = filters.get("movement_status") if filters else None

    if filters:
        routes_df = _apply_filters(
            routes_df,
            {
                column_name: filter_value
                for column_name, filter_value in filters.items()
                if column_name != "movement_status"
            },
        )

    routes = [_row_to_route(row) for row in routes_df.to_dict(orient="records")]

    movement_status_values = _as_list(movement_status_filter)

    if movement_status_values:
        normalized_movement_statuses = {
            movement_status.casefold() for movement_status in movement_status_values
        }
        routes = [
            route
            for route in routes
            if route.pricing.movement_status.casefold() in normalized_movement_statuses
        ]

    return routes


def _apply_filters(
    routes_df: pd.DataFrame,
    filters: dict[str, FilterValue],
) -> pd.DataFrame:
    filtered_df = routes_df
    filtered_df = _apply_port_pair_filter(
        filtered_df,
        port_column="origin_port",
        country_column="origin_country",
        ports=filters.get("origin_port"),
        countries=filters.get("origin_country"),
    )
    filtered_df = _apply_port_pair_filter(
        filtered_df,
        port_column="destination_port",
        country_column="destination_country",
        ports=filters.get("destination_port"),
        countries=filters.get("destination_country"),
    )

    for column_name, filter_value in filters.items():
        if (
            not filter_value
            or column_name
            in {
                "origin_port",
                "origin_country",
                "destination_port",
                "destination_country",
            }
        ):
            continue

        filter_values = _as_list(filter_value)
        normalized_values = {value.casefold() for value in filter_values}

        filtered_df = filtered_df[
            filtered_df[column_name].astype(str).str.casefold().isin(normalized_values)
        ]

    return filtered_df


def _apply_port_pair_filter(
    routes_df: pd.DataFrame,
    port_column: str,
    country_column: str,
    ports: FilterValue,
    countries: FilterValue,
) -> pd.DataFrame:
    port_values = _as_list(ports)
    country_values = _as_list(countries)

    if not port_values and not country_values:
        return routes_df

    if port_values and country_values and len(port_values) == len(country_values):
        selected_pairs = {
            (port.casefold(), country.casefold())
            for port, country in zip(port_values, country_values, strict=True)
        }

        return routes_df[
            routes_df.apply(
                lambda row: (
                    str(row[port_column]).casefold(),
                    str(row[country_column]).casefold(),
                )
                in selected_pairs,
                axis=1,
            )
        ]

    filtered_df = routes_df

    if port_values:
        normalized_ports = {port.casefold() for port in port_values}
        filtered_df = filtered_df[
            filtered_df[port_column].astype(str).str.casefold().isin(normalized_ports)
        ]

    if country_values:
        normalized_countries = {country.casefold() for country in country_values}
        filtered_df = filtered_df[
            filtered_df[country_column]
            .astype(str)
            .str.casefold()
            .isin(normalized_countries)
        ]

    return filtered_df


def _as_list(value: FilterValue) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [item for item in value if item]
    if value:
        return [value]
    return []


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
