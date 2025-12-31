import { useState } from "react";

import { Card } from "../components/atoms/Card";
import { Icon } from "../components/atoms/Icon";
import { AreasCatalog } from "../components/organisms/catalogs/AreasCatalog";
import { DepartmentsCatalog } from "../components/organisms/catalogs/DepartmentsCatalog";
import { EmailsCatalog } from "../components/organisms/catalogs/EmailsCatalog";
import { ReceptorsCatalog } from "../components/organisms/catalogs/ReceptorsCatalog";
import { TorretaColorsCatalog } from "../components/organisms/catalogs/TorretaColorsCatalog";
import { TorretasCatalog } from "../components/organisms/catalogs/TorretasCatalog";

type CatalogId =
  | "areas"
  | "departments"
  | "torretas"
  | "torreta-colors"
  | "receptors"
  | "emails";

const allCatalogs = [
  { id: "areas" as CatalogId, name: "Áreas", icon: "building" },
  { id: "departments" as CatalogId, name: "Departamentos", icon: "users" },
  { id: "torretas" as CatalogId, name: "Torretas", icon: "tower" },
  {
    id: "torreta-colors" as CatalogId,
    name: "Colores de Torreta",
    icon: "palette",
  },
  { id: "receptors" as CatalogId, name: "Receptores", icon: "radio" },
  { id: "emails" as CatalogId, name: "Correos", icon: "mail" },
] as const;

export function CatalogsPage() {
  const [activeCatalog, setActiveCatalog] = useState<CatalogId>("areas");

  const renderCatalog = () => {
    switch (activeCatalog) {
      case "areas":
        return <AreasCatalog />;
      case "departments":
        return <DepartmentsCatalog />;
      case "torretas":
        return <TorretasCatalog />;
      case "torreta-colors":
        return <TorretaColorsCatalog />;
      case "receptors":
        return <ReceptorsCatalog />;
      case "emails":
        return <EmailsCatalog />;
      default:
        return <AreasCatalog />;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Gestión de Catálogos
          </h1>
          <p className="mt-2 text-slate-400">
            Administra los catálogos del sistema
          </p>
        </div>

        {/* Catalog Tabs Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-1 border-b border-slate-600 overflow-x-auto">
            {allCatalogs.map((catalog) => (
              <button
                key={catalog.id}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeCatalog === catalog.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-white hover:border-slate-500"
                }`}
                data-cy={`catalog-tab-${catalog.id}`}
                onClick={() => setActiveCatalog(catalog.id)}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-2" name={catalog.icon} />
                  {catalog.name}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
        <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
          <div className="p-6 flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {allCatalogs.find((c) => c.id === activeCatalog)?.name}
                </h2>
                <p className="text-slate-400">
                  Gestiona los registros de este catálogo
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {renderCatalog()}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
