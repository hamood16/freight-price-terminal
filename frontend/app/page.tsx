"use client";

import { useCallback, useEffect, useState } from "react";

import { RouteListPanel } from "./components/RouteListPanel";
import { RouteDetailsModal } from "./components/RouteDetailsModal";
import { RoutesMap } from "./components/RoutesMap";
import type { RouteFilters, ShippingRoute } from "./types/routes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  const [allRoutes, setAllRoutes] = useState<ShippingRoute[]>([]);
  const [routes, setRoutes] = useState<ShippingRoute[]>([]);
  const [filters, setFilters] = useState<RouteFilters>({
    carrier: "",
    destination_ports: [],
    product_category: "",
    movement_status: "",
    origin_ports: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoutes() {
      try {
        const data = await fetchRoutes(undefined, controller.signal);
        setAllRoutes(data);
        setRoutes(data);
        setErrorMessage(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load shipping routes.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRoutes();

    return () => {
      controller.abort();
    };
  }, []);

  async function applyFilters() {
    setIsFiltering(true);
    setErrorMessage(null);

    try {
      const data = await fetchRoutes(filters);
      setRoutes(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to apply route filters.",
      );
    } finally {
      setIsFiltering(false);
    }
  }

  async function clearFilters() {
    const clearedFilters: RouteFilters = {
      carrier: "",
      destination_ports: [],
      product_category: "",
      movement_status: "",
      origin_ports: [],
    };

    setFilters(clearedFilters);
    setIsFiltering(true);
    setErrorMessage(null);

    try {
      const data = await fetchRoutes(clearedFilters);
      setRoutes(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to clear route filters.",
      );
    } finally {
      setIsFiltering(false);
    }
  }

  const openRouteDetails = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
  }, []);

  const closeRouteDetails = useCallback(() => {
    setSelectedRouteId(null);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 lg:h-screen lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              Freight Route Price Terminal
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
              Sea freight route monitor
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Compare route movement, pricing signals, and transit windows from
              the backend route API.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm">
            <p className="font-medium text-zinc-500">Data source</p>
            <p className="mt-1 font-semibold text-zinc-950">Backend /routes</p>
          </div>
        </header>

        <section className="grid min-h-0 gap-5 py-5 lg:h-[calc(100vh-180px)] lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch lg:overflow-hidden">
          {isLoading ? (
            <StatusCard
              title="Loading routes"
              message="Fetching shipping route data from the backend."
            />
          ) : errorMessage ? (
            <StatusCard
              title="Unable to load routes"
              message={`${errorMessage} Check that the backend is running on http://localhost:8000.`}
            />
          ) : (
            <>
              <RoutesMap onRouteSelect={openRouteDetails} routes={routes} />
              <RouteListPanel
                allRoutes={allRoutes}
                filters={filters}
                isFiltering={isFiltering}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                onFiltersChange={setFilters}
                onRouteSelect={openRouteDetails}
                routes={routes}
              />
            </>
          )}
        </section>
      </div>
      <RouteDetailsModal
        apiBaseUrl={API_BASE_URL}
        onClose={closeRouteDetails}
        routeId={selectedRouteId}
      />
    </main>
  );
}

async function fetchRoutes(
  filters?: RouteFilters,
  signal?: AbortSignal,
): Promise<ShippingRoute[]> {
  const searchParams = new URLSearchParams();

  if (filters?.carrier) {
    searchParams.set("carrier", filters.carrier);
  }
  for (const destination of filters?.destination_ports ?? []) {
    searchParams.append("destination_port", destination.port);
    searchParams.append("destination_country", destination.country);
  }
  if (filters?.product_category) {
    searchParams.set("product_category", filters.product_category);
  }
  if (filters?.movement_status) {
    searchParams.set("movement_status", filters.movement_status);
  }
  for (const origin of filters?.origin_ports ?? []) {
    searchParams.append("origin_port", origin.port);
    searchParams.append("origin_country", origin.country);
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    `${API_BASE_URL}/routes${queryString ? `?${queryString}` : ""}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Routes request failed with status ${response.status}`);
  }

  return (await response.json()) as ShippingRoute[];
}

function StatusCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid min-h-[520px] place-items-center rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm lg:col-span-2">
      <div>
        <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
          {message}
        </p>
      </div>
    </div>
  );
}
