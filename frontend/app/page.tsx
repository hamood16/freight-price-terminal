"use client";

import { useEffect, useState } from "react";

import { RouteListPanel } from "./components/RouteListPanel";
import { RoutesMap } from "./components/RoutesMap";
import type { ShippingRoute } from "./types/routes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  const [routes, setRoutes] = useState<ShippingRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoutes() {
      try {
        const response = await fetch(`${API_BASE_URL}/routes`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Routes request failed with status ${response.status}`);
        }

        const data = (await response.json()) as ShippingRoute[];
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
              <RoutesMap routes={routes} />
              <RouteListPanel routes={routes} />
            </>
          )}
        </section>
      </div>
    </main>
  );
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
