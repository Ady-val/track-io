import { FaChartLine, FaRotate } from "react-icons/fa6";

import { Text, Card, CardBody } from "@components/atoms";
import {
  MeasurementChart,
  EmptyState,
  LoadingState,
  ConnectionIndicator,
} from "@components/molecules";
import { PageHeader } from "@components/organisms";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useDashboardMeasurements } from "@/hooks/useDashboardMeasurements";
import { useRealtimeMeasurementValues } from "@/hooks/useRealtimeMeasurementValues";
import DefaultLayout from "@/layouts/default";

export default function DashboardMeasurementsPage() {
  const { dashboards, loading, error, refetch } = useDashboardMeasurements();
  const { values, getTimestamp, getHistory } = useRealtimeMeasurementValues();
  const { isConnected } = useWebSocket();

  console.log(
    "🎯 Dashboard rendered. Dashboards:",
    dashboards.length,
    "Values:",
    values
  );

  if (loading) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-4 py-8">
          <LoadingState message="Cargando configuraciones de dashboard..." />
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            description={`Error al cargar dashboards: ${error}`}
            icon={FaChartLine}
            title="Error de Conexión"
          />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-8">
          <PageHeader
            action={{
              label: "Actualizar",
              onClick: refetch,
              variant: "ghost",
              icon: <FaRotate className="w-4 h-4" />,
            }}
            description="Monitoreo en tiempo real de mediciones configuradas"
            title="Dashboard de Mediciones"
          />
        </div>

        {dashboards.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <EmptyState
              description="Configura mediciones para comenzar a monitorear en tiempo real"
              icon={FaChartLine}
              title="No hay mediciones configuradas"
            />
          </div>
        ) : (
          <>
            {/* Grid de Gauge Charts - Con scroll */}
            <div className="flex-1 overflow-y-auto px-4 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-2">
                {dashboards.map((dashboard) => (
                  <MeasurementChart
                    key={dashboard.id}
                    history={getHistory(dashboard.measurementId)}
                    maxValue={dashboard.maxValue ?? 100}
                    minValue={dashboard.minValue ?? 0}
                    subtitle={dashboard.measurement.externalId}
                    timestamp={getTimestamp(dashboard.measurementId)}
                    title={dashboard.measurement.name}
                    type={dashboard.measurement.type}
                    value={(values as any)[dashboard.measurementId]?.value}
                  />
                ))}
              </div>
            </div>

            {/* Footer con indicador de conexión WebSocket */}
            <div className="flex-shrink-0 px-4 pb-1">
              <Card>
                <CardBody className="p-2">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      <ConnectionIndicator
                        connectedText="Conexión WebSocket Activa"
                        disconnectedText="Desconectado"
                        isConnected={isConnected}
                      />
                      <div className="h-3 w-px bg-slate-600" />
                      <Text color="muted" variant="small">
                        new_measurement_value
                      </Text>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
}
