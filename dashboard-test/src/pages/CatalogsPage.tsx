import { useState } from "react";

import { Card } from "../components/atoms/Card";
import { Icon } from "../components/atoms/Icon";
import { AreasCatalog } from "../components/organisms/catalogs/AreasCatalog";
import { DepartmentsCatalog } from "../components/organisms/catalogs/DepartmentsCatalog";
import { ReceptorsCatalog } from "../components/organisms/catalogs/ReceptorsCatalog";
import { TorretaColorsCatalog } from "../components/organisms/catalogs/TorretaColorsCatalog";
import { TorretasCatalog } from "../components/organisms/catalogs/TorretasCatalog";
import { DashboardTemplate } from "../components/templates/monitoring/DashboardTemplate";

type CatalogType = "signals" | "measurements";
type SignalsCatalog = "areas" | "departments";
type MeasurementsCatalog = "torretas" | "torreta-colors" | "receptors";

export function CatalogsPage() {
  const [catalogType, setCatalogType] = useState<CatalogType>("signals");
  const [signalsCatalog, setSignalsCatalog] = useState<SignalsCatalog>("areas");
  const [measurementsCatalog, setMeasurementsCatalog] =
    useState<MeasurementsCatalog>("torretas");

  const signalsCatalogs = [
    { id: "areas", name: "Áreas", icon: "building" },
    { id: "departments", name: "Departamentos", icon: "users" },
  ];

  const measurementsCatalogs = [
    { id: "torretas", name: "Torretas", icon: "tower" },
    { id: "torreta-colors", name: "Colores de Torreta", icon: "palette" },
    { id: "receptors", name: "Receptores", icon: "radio" },
  ];

  const renderCatalog = () => {
    if (catalogType === "signals") {
      switch (signalsCatalog) {
        case "areas":
          return <AreasCatalog />;
        case "departments":
          return <DepartmentsCatalog />;
        default:
          return <AreasCatalog />;
      }
    } else {
      switch (measurementsCatalog) {
        case "torretas":
          return <TorretasCatalog />;
        case "torreta-colors":
          return <TorretaColorsCatalog />;
        case "receptors":
          return <ReceptorsCatalog />;
        default:
          return <TorretasCatalog />;
      }
    }
  };

  return (
    <DashboardTemplate>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Gestión de Catálogos</h1>
        <p className="mt-2 text-slate-400">
          Administra los catálogos del sistema organizados por flujo de datos
        </p>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-slate-600">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              catalogType === "signals"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white hover:border-slate-500"
            }`}
            onClick={() => setCatalogType("signals")}
          >
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-2" name="signal" />
              Señales
            </div>
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              catalogType === "measurements"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white hover:border-slate-500"
            }`}
            onClick={() => setCatalogType("measurements")}
          >
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-2" name="activity" />
              Mediciones
            </div>
          </button>
        </nav>
      </div>

      {/* Main Content Area with Secondary Sidebar */}
      <div className="flex gap-6">
        {/* Secondary Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-4">
                Catálogos
              </h3>
              <nav className="space-y-1">
                {catalogType === "signals"
                  ? signalsCatalogs.map((catalog) => (
                      <button
                        key={catalog.id}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          signalsCatalog === catalog.id
                            ? "bg-blue-900/30 text-blue-300 border-l-2 border-blue-500"
                            : "text-slate-400 hover:text-white hover:bg-slate-700"
                        }`}
                        onClick={() =>
                          setSignalsCatalog(catalog.id as SignalsCatalog)
                        }
                      >
                        <Icon className="w-4 h-4 mr-3" name={catalog.icon} />
                        {catalog.name}
                      </button>
                    ))
                  : measurementsCatalogs.map((catalog) => (
                      <button
                        key={catalog.id}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          measurementsCatalog === catalog.id
                            ? "bg-blue-900/30 text-blue-300 border-l-2 border-blue-500"
                            : "text-slate-400 hover:text-white hover:bg-slate-700"
                        }`}
                        onClick={() =>
                          setMeasurementsCatalog(
                            catalog.id as MeasurementsCatalog
                          )
                        }
                      >
                        <Icon className="w-4 h-4 mr-3" name={catalog.icon} />
                        {catalog.name}
                      </button>
                    ))}
              </nav>
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {catalogType === "signals"
                      ? signalsCatalogs.find((c) => c.id === signalsCatalog)
                          ?.name
                      : measurementsCatalogs.find(
                          (c) => c.id === measurementsCatalog
                        )?.name}
                  </h2>
                  <p className="text-slate-400">
                    Gestiona los registros de este catálogo
                  </p>
                </div>
              </div>

              {renderCatalog()}
            </div>
          </Card>
        </div>
      </div>
    </DashboardTemplate>
  );
}
