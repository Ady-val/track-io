import { useState, useEffect } from "react";

import { FaEdit, FaTrash } from "react-icons/fa";
import { FaChartLine, FaPlus, FaLayerGroup } from "react-icons/fa6";

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
import { CreateDashboardMeasurementModal } from "@/components/organisms/CreateDashboardMeasurementModal";
import { EditDashboardMeasurementModal } from "@/components/organisms/EditDashboardMeasurementModal";
import { DeleteDashboardMeasurementModal } from "@/components/organisms/DeleteDashboardMeasurementModal";

import { Module, Action } from "@/constants/permissions";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useDashboardMeasurementGroups } from "@/hooks/useDashboardMeasurementGroups";
import { useDashboardMeasurements } from "@/hooks/useDashboardMeasurements";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useRealtimeMeasurementValues } from "@/hooks/useRealtimeMeasurementValues";
import { diffSecondsUtc, normalizeTimestampString } from "@/lib/dateTime";
import dashboardMeasurementGroupService from "@/lib/services/dashboard-measurement-group.service";
import dashboardMeasurementService from "@/lib/services/dashboard-measurement.service";
import type {
  CreateDashboardMeasurementGroupData,
  UpdateDashboardMeasurementGroupData,
} from "@/types/dashboard-measurement-group";
import type {
  CreateDashboardMeasurementWithMeasurementData,
  UpdateDashboardMeasurementWithMeasurementData,
} from "@/types/dashboard-measurement";

export default function DashboardMeasurementsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateMeasurementModalOpen, setIsCreateMeasurementModalOpen] =
    useState(false);
  const [isEditMeasurementModalOpen, setIsEditMeasurementModalOpen] =
    useState(false);
  const [isDeleteMeasurementModalOpen, setIsDeleteMeasurementModalOpen] =
    useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<
    (typeof dashboards)[number] | null
  >(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [isUpdatingDashboard, setIsUpdatingDashboard] = useState(false);

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
    updateGroup,
    deleteGroupById,
  } = useDashboardMeasurementGroups();
  const { dashboards, loading, error, refetch } =
    useDashboardMeasurements(selectedGroupId);
  const {
    values,
    getTimestamp,
    getHistory,
    getOnStartTime,
    getOffStartTime,
    getStatusDurationSeconds,
    initializeValue,
  } =
    useRealtimeMeasurementValues();
  const { isConnected } = useWebSocket();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  // Initialize values from backend when dashboards are loaded
  useEffect(() => {
    if (!dashboards || dashboards.length === 0 || loading) {
      return;
    }

    dashboards.forEach((dashboard) => {
      // Only initialize for status type measurements
      if (dashboard.measurement?.type !== "status") {
        return;
      }

      if (!dashboard.latestValue) {
        return;
      }

      const { value, createdAt } = dashboard.latestValue;
      if (!value || !createdAt) {
        return;
      }

      // Initialize the value with onStartTime/offStartTime from backend
      initializeValue(
        dashboard.measurementId,
        value,
        createdAt,
        dashboard.onStartTime,
        dashboard.offStartTime,
        dashboard.statusDurationSeconds
      );
    });
  }, [dashboards, initializeValue, loading]);

  const hasChart1Config =
    selectedGroup?.chartTimeRange &&
    selectedGroup.chartMinValue !== undefined &&
    selectedGroup.chartMaxValue !== undefined &&
    selectedGroup.chartMeasurementIds &&
    selectedGroup.chartMeasurementIds.length > 0;
  const hasChart2Config =
    selectedGroup?.chart2TimeRange &&
    selectedGroup.chart2MinValue !== undefined &&
    selectedGroup.chart2MaxValue !== undefined &&
    selectedGroup.chart2MeasurementIds &&
    selectedGroup.chart2MeasurementIds.length > 0;
  const hasAnyChartConfig = hasChart1Config || hasChart2Config;
  const hasBothCharts = hasChart1Config && hasChart2Config;

  const chartMeasurements =
    hasChart1Config && selectedGroup
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

  const chartInitialPoints =
    hasChart1Config && selectedGroup
      ? dashboards
          .filter((dashboard) =>
            selectedGroup.chartMeasurementIds?.includes(dashboard.measurementId)
          )
          .map((dashboard) => {
            const latestValue = dashboard.latestValue;
            if (!latestValue?.value || !latestValue?.createdAt) {
              return null;
            }

            const numericValue = parseFloat(String(latestValue.value));
            if (!Number.isFinite(numericValue)) {
              return null;
            }

            return {
              measurementId: dashboard.measurementId,
              value: numericValue,
              createdAt: latestValue.createdAt,
            };
          })
          .filter((point): point is { measurementId: number; value: number; createdAt: string } => point !== null)
      : [];

  const chart2Measurements =
    hasChart2Config && selectedGroup
      ? dashboards
          .filter((dashboard) =>
            selectedGroup.chart2MeasurementIds?.includes(dashboard.measurementId)
          )
          .map((dashboard) => ({
            id: dashboard.id,
            measurementId: dashboard.measurementId,
            minValue: dashboard.minValue ?? 0,
            maxValue: dashboard.maxValue ?? 100,
            measurement: dashboard.measurement,
          }))
      : [];

  const chart2InitialPoints =
    hasChart2Config && selectedGroup
      ? dashboards
          .filter((dashboard) =>
            selectedGroup.chart2MeasurementIds?.includes(dashboard.measurementId)
          )
          .map((dashboard) => {
            const latestValue = dashboard.latestValue;
            if (!latestValue?.value || !latestValue?.createdAt) {
              return null;
            }

            const numericValue = parseFloat(String(latestValue.value));
            if (!Number.isFinite(numericValue)) {
              return null;
            }

            return {
              measurementId: dashboard.measurementId,
              value: numericValue,
              createdAt: latestValue.createdAt,
            };
          })
          .filter((point): point is { measurementId: number; value: number; createdAt: string } => point !== null)
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
      const updatedGroup = await dashboardMeasurementGroupService.update(
        id,
        data
      );
      updateGroup(updatedGroup);
      setSelectedGroupId(updatedGroup.id);
      void refetchGroups();
      if (data.dashboardMeasurements) {
        await refetch();
      }
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (selectedGroup) {
      deleteGroupById(selectedGroup.id);
    }
    void refetchGroups();
    setSelectedGroupId(null);
    setIsDeleteModalOpen(false);
  };

  // Dashboard measurement handlers
  const handleCreateDashboard = async (
    data: CreateDashboardMeasurementWithMeasurementData
  ) => {
    setIsCreatingDashboard(true);
    try {
      // attach selected group if any and user did not select a group
      // Only use page's selected group if groupId is undefined (not explicitly set)
      // If groupId is null, user explicitly selected "Sin grupo", so respect that choice
      const payload = {
        ...data,
        groupId:
          data.groupId === undefined ? (selectedGroupId ?? null) : data.groupId,
      };
      await dashboardMeasurementService.createWithMeasurement(payload);
      await refetch();
      setIsCreateMeasurementModalOpen(false);
    } catch (error) {
      console.error("Error creating dashboard measurement:", error);
    } finally {
      setIsCreatingDashboard(false);
    }
  };

  const handleUpdateDashboard = async (
    id: number,
    data: UpdateDashboardMeasurementWithMeasurementData
  ) => {
    setIsUpdatingDashboard(true);
    try {
      await dashboardMeasurementService.updateWithMeasurement(id, data);
      await refetch();
      setIsEditMeasurementModalOpen(false);
    } catch (error) {
      console.error("Error updating dashboard measurement:", error);
    } finally {
      setIsUpdatingDashboard(false);
    }
  };

  const handleDeleteDashboard = async (id: number) => {
    try {
      await dashboardMeasurementService.delete(id);
      await refetch();
      setIsDeleteMeasurementModalOpen(false);
      setSelectedDashboard(null);
    } catch (error) {
      console.error("Error deleting dashboard measurement:", error);
    }
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
    <div className="flex flex-col h-full p-6 overflow-x-hidden">
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
                        Editar Grupo
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
                        Eliminar Grupo
                      </Button>
                    )}
                  </>
                ) : hasCreatePermission ? (
                  <Button
                    color="primary"
                    size="md"
                    variant="solid"
                    onPress={() => setIsCreateModalOpen(true)}
                  >
                    <FaLayerGroup className="mr-2" />
                    Crear Grupo
                  </Button>
                ) : null}
                {hasCreatePermission && (
                  <Button
                    className="text-white"
                    color="success"
                    size="md"
                    variant="solid"
                    onPress={() => setIsCreateMeasurementModalOpen(true)}
                  >
                    <FaPlus className="mr-2" />
                    Crear Measurement
                  </Button>
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
              hasAnyChartConfig ? "h-1/2" : "flex-1"
            }`}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-wrap flex-between gap-6 pb-4">
              {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4"> */}
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
                  const displayTimestamp = normalizeTimestampString(
                    realtimeTimestamp ?? backendTimestamp
                  );

                  const realtimeOnStartTime = getOnStartTime(
                    dashboard.measurementId
                  );
                  const backendOnStartTime = dashboard.onStartTime;
                  const displayOnStartTime =
                    realtimeOnStartTime ?? backendOnStartTime;

                  const realtimeOffStartTime = getOffStartTime(
                    dashboard.measurementId
                  );
                  const backendOffStartTime = dashboard.offStartTime;
                  const displayOffStartTime =
                    realtimeOffStartTime ?? backendOffStartTime;
                  const realtimeStatusDurationSeconds =
                    getStatusDurationSeconds(dashboard.measurementId);
                  const backendStatusDurationSeconds =
                    dashboard.statusDurationSeconds ??
                    diffSecondsUtc(
                      dashboard.statusStartTime,
                      dashboard.serverTime
                    );
                  const displayStatusDurationSeconds =
                    realtimeStatusDurationSeconds ?? backendStatusDurationSeconds;

                  // Log for status measurements only
                  if (dashboard.measurement?.type === "status") {
                  }

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
                      offStartTime={displayOffStartTime}
                      statusDurationSeconds={displayStatusDurationSeconds}
                      showActions={hasUpdatePermission || hasDeletePermission}
                      onEdit={
                        hasUpdatePermission
                          ? () => {
                              setSelectedDashboard(dashboard);
                              setIsEditMeasurementModalOpen(true);
                            }
                          : undefined
                      }
                      onDelete={
                        hasDeletePermission
                          ? () => {
                              setSelectedDashboard(dashboard);
                              setIsDeleteMeasurementModalOpen(true);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {selectedGroup && hasAnyChartConfig && (
            <div
              className={`h-1/2 flex-shrink-0 overflow-x-hidden ${
                hasBothCharts ? "flex gap-4" : "flex flex-col"
              }`}
            >
              {hasChart1Config && chartMeasurements.length > 0 && (
                <div className={hasBothCharts ? "w-1/2" : "flex-1"}>
                  <RealtimeGroupChart
                    maxValue={selectedGroup.chartMaxValue ?? 100}
                    measurementIds={selectedGroup.chartMeasurementIds ?? []}
                    measurements={chartMeasurements}
                    minValue={selectedGroup.chartMinValue ?? 0}
                    initialPoints={chartInitialPoints}
                    timeRange={selectedGroup.chartTimeRange ?? 10}
                  />
                </div>
              )}
              {hasChart2Config && chart2Measurements.length > 0 && (
                <div className={hasBothCharts ? "w-1/2" : "flex-1"}>
                  <RealtimeGroupChart
                    maxValue={selectedGroup.chart2MaxValue ?? 100}
                    measurementIds={selectedGroup.chart2MeasurementIds ?? []}
                    measurements={chart2Measurements}
                    minValue={selectedGroup.chart2MinValue ?? 0}
                    initialPoints={chart2InitialPoints}
                    timeRange={selectedGroup.chart2TimeRange ?? 10}
                    reverseColors
                  />
                </div>
              )}
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

      <CreateDashboardMeasurementModal
        isLoading={isCreatingDashboard}
        isOpen={isCreateMeasurementModalOpen}
        onClose={() => setIsCreateMeasurementModalOpen(false)}
        onSubmit={handleCreateDashboard}
      />
      <EditDashboardMeasurementModal
        dashboard={selectedDashboard}
        isLoading={isUpdatingDashboard}
        isOpen={isEditMeasurementModalOpen}
        onClose={() => setIsEditMeasurementModalOpen(false)}
        onSubmit={handleUpdateDashboard}
      />
      <DeleteDashboardMeasurementModal
        dashboard={selectedDashboard}
        isOpen={isDeleteMeasurementModalOpen}
        onClose={() => setIsDeleteMeasurementModalOpen(false)}
        onConfirm={async (id) => {
          await handleDeleteDashboard(id);
        }}
      />
    </div>
  );
}
