import { useState } from "react";

import { FaEdit, FaTrash } from "react-icons/fa";
import { FaChartLine, FaPlus } from "react-icons/fa6";

import { Text, Card, CardBody, Button, Select } from "@components/atoms";
import {
  MeasurementChart,
  EmptyState,
  LoadingState,
  ConnectionIndicator,
  RealtimeGroupChart,
} from "@components/molecules";
import {
  CreateDashboardGroupModal,
  EditDashboardGroupModal,
  DeleteDashboardGroupModal,
} from "@components/organisms";

import { Module, Action } from "@/constants/permissions";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useDashboardMeasurementGroups } from "@/hooks/useDashboardMeasurementGroups";
import { useDashboardMeasurements } from "@/hooks/useDashboardMeasurements";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useRealtimeMeasurementValues } from "@/hooks/useRealtimeMeasurementValues";
import dashboardMeasurementGroupService from "@/lib/services/dashboard-measurement-group.service";
import type {
  CreateDashboardMeasurementGroupData,
  UpdateDashboardMeasurementGroupData,
} from "@/types/dashboard-measurement-group";

export default function DashboardMeasurementsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  const hasCreatePermission = useHasPermission(
    Module.MEASUREMENTS,
    Action.CREATE
  );
  const hasUpdatePermission = useHasPermission(
    Module.MEASUREMENTS,
    Action.UPDATE
  );
  const hasDeletePermission = useHasPermission(
    Module.MEASUREMENTS,
    Action.DELETE
  );

  const {
    groups,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useDashboardMeasurementGroups();
  const { dashboards, loading, error, refetch } =
    useDashboardMeasurements(selectedGroupId);
  const { values, getTimestamp, getHistory, getOnStartTime } =
    useRealtimeMeasurementValues();
  const { isConnected } = useWebSocket();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  const hasChartConfig =
    selectedGroup?.chartTimeRange &&
    selectedGroup.chartMinValue !== undefined &&
    selectedGroup.chartMaxValue !== undefined &&
    selectedGroup.chartMeasurementIds &&
    selectedGroup.chartMeasurementIds.length > 0;

  const chartMeasurements =
    hasChartConfig && selectedGroup
      ? dashboards
          .filter((dashboard) =>
            selectedGroup.chartMeasurementIds?.includes(dashboard.measurementId)
          )
          .map((dashboard) => ({
            id: dashboard.id,
            measurementId: dashboard.measurementId,
            minValue: dashboard.minValue ?? 0,
            maxValue: dashboard.maxValue ?? 100,
            measurement: dashboard.measurement,
          }))
      : [];

  const handleCreateGroup = async (
    data: CreateDashboardMeasurementGroupData
  ) => {
    setIsCreatingGroup(true);
    try {
      await dashboardMeasurementGroupService.create(data);
      await refetchGroups();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleUpdateGroup = async (
    id: number,
    data: UpdateDashboardMeasurementGroupData
  ) => {
    setIsUpdatingGroup(true);
    try {
      await dashboardMeasurementGroupService.update(id, data);
      await refetchGroups();
      await refetch();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    await refetchGroups();
    setSelectedGroupId(null);
    setIsDeleteModalOpen(false);
  };

  if (loading || groupsLoading) {
    return <LoadingState message="Cargando configuraciones de dashboard..." />;
  }

  if (error) {
    return (
      <EmptyState
        description={`Error al cargar dashboards: ${error}`}
        icon={FaChartLine}
        title="Error de Conexión"
      />
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <header className="flex-shrink-0 mb-4">
        <Card>
          <CardBody className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Text className="mb-1" variant="h3">
                  Dashboard de Mediciones
                </Text>
                <Text color="muted" variant="body">
                  Monitoreo en tiempo real de mediciones configuradas
                </Text>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-64">
                  <Select
                    fullWidth
                    value={
                      selectedGroupId !== null ? selectedGroupId.toString() : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;

                      setSelectedGroupId(value ? Number(value) : null);
                    }}
                  >
                    <option value="">Todos los measurements</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id.toString()}>
                        {group.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {selectedGroupId ? (
                  <>
                    {hasUpdatePermission && (
                      <Button
                        className="text-white"
                        color="warning"
                        size="md"
                        variant="solid"
                        onPress={() => setIsEditModalOpen(true)}
                      >
                        <FaEdit className="mr-2" />
                        Editar
                      </Button>
                    )}
                    {hasDeletePermission && (
                      <Button
                        className="text-white"
                        color="danger"
                        size="md"
                        variant="solid"
                        onPress={() => setIsDeleteModalOpen(true)}
                      >
                        <FaTrash className="mr-2" />
                        Eliminar
                      </Button>
                    )}
                  </>
                ) : (
                  hasCreatePermission && (
                    <Button
                      color="primary"
                      size="md"
                      variant="solid"
                      onPress={() => setIsCreateModalOpen(true)}
                    >
                      <FaPlus className="mr-2" />
                      Crear Grupo
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </header>

      {dashboards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            description="Configura mediciones para comenzar a monitorear en tiempo real"
            icon={FaChartLine}
            title="No hay mediciones configuradas"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div
            className={`flex flex-col min-h-0 ${
              hasChartConfig ? "h-1/2" : "flex-1"
            }`}
          >
            <div className="flex-1 overflow-y-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
                {dashboards.map((dashboard) => {
                  const parseValue = (
                    value: string | undefined
                  ): number | boolean | undefined => {
                    if (!value) return undefined;
                    const str = String(value).toLowerCase().trim();

                    if (str === "true" || str === "1" || str === "on")
                      return true;
                    if (str === "false" || str === "0" || str === "off")
                      return false;
                    const num = parseFloat(str);

                    return isNaN(num) ? undefined : num;
                  };

                  const realtimeValue = values[dashboard.measurementId]?.value;
                  const backendValue = parseValue(dashboard.latestValue?.value);
                  const displayValue =
                    realtimeValue !== undefined ? realtimeValue : backendValue;

                  const realtimeTimestamp = getTimestamp(
                    dashboard.measurementId
                  );
                  const backendTimestamp = dashboard.latestValue?.createdAt;
                  const displayTimestamp =
                    realtimeTimestamp ?? backendTimestamp;

                  const realtimeOnStartTime = getOnStartTime(
                    dashboard.measurementId
                  );
                  const backendOnStartTime = dashboard.onStartTime;
                  const displayOnStartTime =
                    realtimeOnStartTime ?? backendOnStartTime;

                  return (
                    <MeasurementChart
                      key={dashboard.id}
                      history={getHistory(dashboard.measurementId)}
                      maxValue={dashboard.maxValue ?? 100}
                      minValue={dashboard.minValue ?? 0}
                      subtitle={dashboard.measurement.externalId}
                      timestamp={displayTimestamp}
                      title={dashboard.measurement.name}
                      type={dashboard.measurement.type}
                      value={displayValue}
                      onStartTime={displayOnStartTime}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {hasChartConfig && selectedGroup && chartMeasurements.length > 0 && (
            <div className="h-1/2 flex-shrink-0 px-4 flex flex-col">
              <RealtimeGroupChart
                maxValue={selectedGroup.chartMaxValue ?? 100}
                measurementIds={selectedGroup.chartMeasurementIds ?? []}
                measurements={chartMeasurements}
                minValue={selectedGroup.chartMinValue ?? 0}
                timeRange={selectedGroup.chartTimeRange ?? 10}
              />
            </div>
          )}
        </div>
      )}

      <footer className="flex-shrink-0 mt-4">
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
      </footer>

      <CreateDashboardGroupModal
        isLoading={isCreatingGroup}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />

      <EditDashboardGroupModal
        group={selectedGroup}
        isLoading={isUpdatingGroup}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateGroup}
      />

      <DeleteDashboardGroupModal
        group={selectedGroup}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteGroup}
      />
    </div>
  );
}
