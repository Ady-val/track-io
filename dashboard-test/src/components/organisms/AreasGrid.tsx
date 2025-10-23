import type React from "react";

import { FaMapMarkedAlt } from "react-icons/fa";

import { Card, CardBody, Text, Chip, Spinner } from "@components/atoms";

import { EmptyState } from "@/components/molecules";
import { AreaCard } from "@/components/molecules/AreaCard";
import { useAreas } from "@/hooks/useAreas";
import type { Area } from "@/types/area";
import type { DashboardAreaData } from "@/types/dashboard";

export interface AreasGridProps {
  onAreaClick?: (area: Area) => void;
  showHeader?: boolean;
}

export const AreasGrid: React.FC<AreasGridProps> = ({
  onAreaClick,
  showHeader = true,
}) => {
  const { areas, loading, error, total } = useAreas();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Spinner color="primary" size="lg" />
          <Text color="muted" variant="small">
            Cargando áreas...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardBody className="p-6">
          <div className="text-center">
            <Text className="mb-2" color="danger" variant="h4">
              Error al cargar áreas
            </Text>
            <Text color="muted" variant="body">
              {error}
            </Text>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <Card className="bg-slate-700 border-slate-600">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaMapMarkedAlt className="text-cyan-400 text-xl" />
                <div>
                  <Text className="mb-1" variant="h3">
                    Áreas Registradas
                  </Text>
                  <Text color="muted" variant="caption">
                    Selecciona un área para ver más detalles
                  </Text>
                </div>
              </div>
              <Chip color="primary" size="sm" variant="flat">
                {total} áreas
              </Chip>
            </div>
          </CardBody>
        </Card>
      )}

      {areas.length === 0 ? (
        <EmptyState
          description="No se encontraron áreas en la base de datos"
          icon={FaMapMarkedAlt}
          title="No hay áreas registradas"
        />
      ) : (
        <div className="flex flex-wrap gap-4 justify-start">
          {areas.map((area) => {
            const dashboardArea: DashboardAreaData = {
              area: area.name,
              eventsTime: new Date().toISOString(),
            };

            return (
              <AreaCard
                key={area.id}
                area={dashboardArea}
                onClick={() => onAreaClick?.(area)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
