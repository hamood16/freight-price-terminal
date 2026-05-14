"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { MovementStatus, RouteDetailResponse } from "../types/routes";

type RouteDetailsModalProps = {
  apiBaseUrl: string;
  onClose: () => void;
  routeId: string | null;
};

const movementStyles: Record<MovementStatus, string> = {
  increase: "border-red-200 bg-red-50 text-red-700",
  decrease: "border-emerald-200 bg-emerald-50 text-emerald-700",
  stable: "border-zinc-200 bg-zinc-50 text-zinc-700",
  unknown: "border-zinc-200 bg-zinc-50 text-zinc-500",
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const costWeights = [10, 100, 1000, 10000];

export function RouteDetailsModal({
  apiBaseUrl,
  onClose,
  routeId,
}: RouteDetailsModalProps) {
  const [routeDetail, setRouteDetail] = useState<RouteDetailResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!routeId) {
      return;
    }

    const controller = new AbortController();
    const selectedRouteId = routeId;

    async function loadRouteDetail() {
      setIsLoading(true);
      setErrorMessage(null);
      setRouteDetail(null);

      try {
        const response = await fetch(
          `${apiBaseUrl}/routes/${encodeURIComponent(selectedRouteId)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(
            `Route details request failed with status ${response.status}`,
          );
        }

        setRouteDetail((await response.json()) as RouteDetailResponse);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load route details.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRouteDetail();

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl, routeId]);

  useEffect(() => {
    if (!routeId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, routeId]);

  if (!routeId) {
    return null;
  }

  const route = routeDetail?.route;
  const details = routeDetail?.details;

  return (
    <div
      aria-labelledby="route-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <section className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              Route details
            </p>
            <h2
              className="mt-1 break-words text-2xl font-semibold text-zinc-950"
              id="route-details-title"
            >
              {route
                ? `${route.origin.port} to ${route.destination.port}`
                : "Loading route"}
            </h2>
          </div>
          <button
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5">
          {isLoading ? (
            <StatusBlock
              message="Fetching route intelligence from the backend."
              title="Loading details"
            />
          ) : errorMessage ? (
            <StatusBlock message={errorMessage} title="Unable to load details" />
          ) : route && details ? (
            <div className="grid gap-4">
              <DetailSection title="Route Overview">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric label="Carrier" value={route.carrier} />
                  <Metric
                    label="Origin"
                    value={`${route.origin.port}, ${route.origin.country}`}
                  />
                  <Metric
                    label="Destination"
                    value={`${route.destination.port}, ${route.destination.country}`}
                  />
                  <Metric
                    label="Product category"
                    value={route.product_category}
                  />
                  <Metric label="Container type" value={route.container_type} />
                  <Metric label="Service type" value={route.service_type} />
                  <Metric label="Transit" value={`${route.transit_days} days`} />
                  <Metric label="Last updated" value={route.last_updated} />
                  <div>
                    <p className="text-xs font-medium uppercase text-zinc-500">
                      Movement
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${movementStyles[route.pricing.movement_status]}`}
                    >
                      {route.pricing.movement_status}
                    </span>
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Pricing Intelligence">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    label="Current price/kg"
                    value={`${route.currency} ${priceFormatter.format(
                      route.pricing.current_price_per_kg,
                    )}`}
                  />
                  <Metric
                    label="Previous price/kg"
                    value={
                      route.pricing.previous_price_per_kg === null
                        ? "Unknown"
                        : `${route.currency} ${priceFormatter.format(
                            route.pricing.previous_price_per_kg,
                          )}`
                    }
                  />
                  <Metric
                    label="Price change"
                    value={
                      route.pricing.price_change_pct === null
                        ? "Unknown"
                        : `${route.pricing.price_change_pct}%`
                    }
                  />
                  <Metric
                    label="Movement"
                    value={route.pricing.movement_status}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {costWeights.map((weight) => (
                    <Metric
                      key={weight}
                      label={`Estimated ${weight.toLocaleString("en-US")} kg`}
                      value={`${route.currency} ${priceFormatter.format(
                        route.pricing.current_price_per_kg * weight,
                      )}`}
                    />
                  ))}
                </div>
              </DetailSection>

              <PlaceholderSection title="Mini Price Chart Placeholder">
                Historical price chart coming soon
              </PlaceholderSection>

              <DetailSection title="Route Performance Stats">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric
                    label="Reliability"
                    value={`${details.reliability_pct}%`}
                  />
                  <Metric
                    label="Average transit"
                    value={`${details.average_transit_days} days`}
                  />
                  <Metric label="Delay risk" value={details.delay_risk} />
                  <Metric
                    label="Port congestion"
                    value={details.port_congestion_level}
                  />
                  <Metric
                    label="Sailings/week"
                    value={details.sailings_per_week}
                  />
                  <Metric
                    label="Transshipments"
                    value={details.transshipment_count}
                  />
                  <Metric
                    label="Customs complexity"
                    value={details.customs_complexity}
                  />
                  <Metric
                    label="Fuel surcharge risk"
                    value={details.fuel_surcharge_risk}
                  />
                  <Metric
                    label="Weather disruption risk"
                    value={details.weather_disruption_risk}
                  />
                </div>
                <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
                  {details.operational_note}
                </p>
              </DetailSection>

              <PlaceholderSection title="Latest Freight News And Signals Placeholder">
                Latest freight news and route intelligence coming soon
              </PlaceholderSection>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-zinc-50 p-3">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold capitalize text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function PlaceholderSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5">
      <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
      <p className="mt-3 text-sm text-zinc-600">{children}</p>
    </section>
  );
}

function StatusBlock({ message, title }: { message: string; title: string }) {
  return (
    <div className="grid min-h-[300px] place-items-center text-center">
      <div>
        <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
      </div>
    </div>
  );
}
