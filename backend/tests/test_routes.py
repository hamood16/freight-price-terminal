from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_routes_returns_data() -> None:
    response = client.get("/routes")

    assert response.status_code == 200
    assert len(response.json()) == 100


def test_route_detail_lookup_returns_route_and_details() -> None:
    response = client.get("/routes/RTE-001")

    route_detail = response.json()

    assert response.status_code == 200
    assert route_detail["route"]["route_id"] == "RTE-001"
    assert route_detail["route"]["origin"]["port"] == "Shanghai"
    assert route_detail["route"]["destination"]["port"] == "Los Angeles"
    assert route_detail["route"]["pricing"]["movement_status"] == "increase"
    assert route_detail["details"]["reliability_pct"] == 79
    assert route_detail["details"]["average_transit_days"] == 14
    assert route_detail["details"]["delay_risk"] == "medium"
    assert route_detail["details"]["port_congestion_level"] == "medium"
    assert route_detail["details"]["sailings_per_week"] == 3
    assert route_detail["details"]["transshipment_count"] == 3
    assert route_detail["details"]["customs_complexity"] == "medium"
    assert route_detail["details"]["fuel_surcharge_risk"] == "medium"
    assert route_detail["details"]["weather_disruption_risk"] == "medium"
    assert route_detail["details"]["operational_note"]


def test_route_detail_lookup_is_case_insensitive() -> None:
    response = client.get("/routes/rte-001")

    assert response.status_code == 200
    assert response.json()["route"]["route_id"] == "RTE-001"


def test_route_detail_lookup_returns_404_for_invalid_route_id() -> None:
    response = client.get("/routes/not-a-real-route")

    assert response.status_code == 404
    assert response.json() == {"detail": "Route not found"}


def test_routes_response_contains_expected_canonical_fields() -> None:
    response = client.get("/routes")

    route = response.json()[0]

    assert route["route_id"]
    assert route["origin"]["port"]
    assert route["origin"]["country"]
    assert isinstance(route["origin"]["lat"], float)
    assert isinstance(route["origin"]["lng"], float)
    assert route["destination"]["port"]
    assert route["destination"]["country"]
    assert isinstance(route["destination"]["lat"], float)
    assert isinstance(route["destination"]["lng"], float)
    assert route["carrier"]
    assert route["service_type"]
    assert route["product_category"]
    assert route["container_type"]
    assert route["currency"]
    assert isinstance(route["pricing"]["current_price_per_kg"], float)
    assert "previous_price_per_kg" in route["pricing"]
    assert "price_change_pct" in route["pricing"]
    assert route["pricing"]["movement_status"] in {
        "increase",
        "decrease",
        "stable",
        "unknown",
    }
    assert isinstance(route["transit_days"], int)
    assert route["last_updated"]


def test_routes_filters_by_origin_country() -> None:
    response = client.get("/routes", params={"origin_country": "China"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 9
    assert all(route["origin"]["country"] == "China" for route in routes)


def test_routes_filters_by_destination_country() -> None:
    response = client.get("/routes", params={"destination_country": "United States"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 18
    assert all(route["destination"]["country"] == "United States" for route in routes)


def test_routes_filters_by_product_category() -> None:
    response = client.get("/routes", params={"product_category": "clothing"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 11
    assert all(route["product_category"] == "clothing" for route in routes)


def test_routes_filters_by_carrier() -> None:
    response = client.get("/routes", params={"carrier": "MSC"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 15
    assert all(route["carrier"] == "MSC" for route in routes)


def test_routes_filters_by_origin_port_and_country() -> None:
    response = client.get(
        "/routes",
        params={"origin_port": "Dubai", "origin_country": "United Arab Emirates"},
    )

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 4
    assert all(route["origin"]["port"] == "Dubai" for route in routes)
    assert all(
        route["origin"]["country"] == "United Arab Emirates" for route in routes
    )


def test_routes_filters_by_multiple_origin_ports_and_countries() -> None:
    response = client.get(
        "/routes",
        params=[
            ("origin_port", "Dubai"),
            ("origin_country", "United Arab Emirates"),
            ("origin_port", "Fujairah"),
            ("origin_country", "United Arab Emirates"),
        ],
    )

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 6
    assert {
        (route["origin"]["port"], route["origin"]["country"]) for route in routes
    } == {
        ("Dubai", "United Arab Emirates"),
        ("Fujairah", "United Arab Emirates"),
    }


def test_routes_filters_by_destination_port_and_country() -> None:
    response = client.get(
        "/routes",
        params={
            "destination_port": "Southampton",
            "destination_country": "United Kingdom",
        },
    )

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 11
    assert all(route["destination"]["port"] == "Southampton" for route in routes)
    assert all(route["destination"]["country"] == "United Kingdom" for route in routes)


def test_routes_filters_by_multiple_destination_ports_and_countries() -> None:
    response = client.get(
        "/routes",
        params=[
            ("destination_port", "Southampton"),
            ("destination_country", "United Kingdom"),
            ("destination_port", "Felixstowe"),
            ("destination_country", "United Kingdom"),
        ],
    )

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 18
    assert {
        (route["destination"]["port"], route["destination"]["country"])
        for route in routes
    } == {
        ("Southampton", "United Kingdom"),
        ("Felixstowe", "United Kingdom"),
    }


def test_routes_filters_by_movement_status() -> None:
    response = client.get("/routes", params={"movement_status": "increase"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 26
    assert all(
        route["pricing"]["movement_status"] == "increase" for route in routes
    )


def test_routes_filters_by_movement_status_case_insensitively() -> None:
    response = client.get("/routes", params={"movement_status": "UNKNOWN"})

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 24
    assert all(route["pricing"]["movement_status"] == "unknown" for route in routes)


def test_routes_filters_by_all_movement_statuses() -> None:
    expected_counts = {
        "increase": 26,
        "decrease": 27,
        "stable": 23,
        "unknown": 24,
    }

    for movement_status, expected_count in expected_counts.items():
        response = client.get(
            "/routes",
            params={"movement_status": movement_status},
        )
        routes = response.json()

        assert response.status_code == 200
        assert len(routes) == expected_count
        assert all(
            route["pricing"]["movement_status"] == movement_status
            for route in routes
        )


def test_routes_combines_carrier_and_derived_filters() -> None:
    response = client.get(
        "/routes",
        params={"carrier": "CMA CGM", "movement_status": "unknown"},
    )

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 3
    assert all(route["carrier"] == "CMA CGM" for route in routes)
    assert all(route["pricing"]["movement_status"] == "unknown" for route in routes)


def test_routes_combines_product_category_departure_and_arrival_port() -> None:
    response = client.get(
        "/routes",
        params={
            "product_category": "vehicles",
            "origin_port": "Dubai",
            "origin_country": "United Arab Emirates",
            "destination_port": "Southampton",
            "destination_country": "United Kingdom",
        },
    )

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 1
    assert routes[0]["product_category"] == "vehicles"
    assert routes[0]["origin"]["port"] == "Dubai"
    assert routes[0]["origin"]["country"] == "United Arab Emirates"
    assert routes[0]["destination"]["port"] == "Southampton"
    assert routes[0]["destination"]["country"] == "United Kingdom"


def test_routes_combines_multi_origin_multi_destination_and_product_category() -> None:
    response = client.get(
        "/routes",
        params=[
            ("product_category", "vehicles"),
            ("origin_port", "Dubai"),
            ("origin_country", "United Arab Emirates"),
            ("origin_port", "Fujairah"),
            ("origin_country", "United Arab Emirates"),
            ("origin_port", "Jeddah"),
            ("origin_country", "Saudi Arabia"),
            ("destination_port", "Southampton"),
            ("destination_country", "United Kingdom"),
            ("destination_port", "Felixstowe"),
            ("destination_country", "United Kingdom"),
            ("destination_port", "Newcastle"),
            ("destination_country", "United Kingdom"),
            ("destination_port", "London Gateway"),
            ("destination_country", "United Kingdom"),
        ],
    )

    routes = response.json()

    assert response.status_code == 200
    assert len(routes) == 7
    assert all(route["product_category"] == "vehicles" for route in routes)
    assert {
        (route["origin"]["port"], route["origin"]["country"]) for route in routes
    } <= {
        ("Dubai", "United Arab Emirates"),
        ("Fujairah", "United Arab Emirates"),
        ("Jeddah", "Saudi Arabia"),
    }
    assert {
        (route["destination"]["port"], route["destination"]["country"])
        for route in routes
    } <= {
        ("Southampton", "United Kingdom"),
        ("Felixstowe", "United Kingdom"),
        ("Newcastle", "United Kingdom"),
        ("London Gateway", "United Kingdom"),
    }


def test_routes_returns_empty_list_for_no_match_multi_port_filters() -> None:
    response = client.get(
        "/routes",
        params=[
            ("product_category", "vehicles"),
            ("origin_port", "Fujairah"),
            ("origin_country", "United Arab Emirates"),
            ("destination_port", "Miami"),
            ("destination_country", "United States"),
        ],
    )

    assert response.status_code == 200
    assert response.json() == []


def test_routes_returns_empty_list_for_no_matches() -> None:
    response = client.get("/routes", params={"origin_country": "Atlantis"})

    assert response.status_code == 200
    assert response.json() == []


def test_movement_status_calculation() -> None:
    response = client.get("/routes")

    routes_by_id = {route["route_id"]: route for route in response.json()}

    assert routes_by_id["RTE-001"]["pricing"]["movement_status"] == "increase"
    assert routes_by_id["RTE-001"]["pricing"]["price_change_pct"] == 13.6
    assert routes_by_id["RTE-002"]["pricing"]["movement_status"] == "decrease"
    assert routes_by_id["RTE-003"]["pricing"]["movement_status"] == "stable"
    assert routes_by_id["RTE-003"]["pricing"]["price_change_pct"] == 0.0
    assert routes_by_id["RTE-004"]["pricing"]["movement_status"] == "unknown"
    assert routes_by_id["RTE-004"]["pricing"]["price_change_pct"] is None
    assert routes_by_id["RTE-005"]["pricing"]["movement_status"] == "unknown"
    assert routes_by_id["RTE-005"]["pricing"]["price_change_pct"] is None
