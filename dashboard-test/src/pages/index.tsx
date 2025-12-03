import React, { useState } from "react";

import { FaTriangleExclamation, FaTemperatureHalf } from "react-icons/fa6";

import { LoadingState } from "@components/molecules";
import {
  PageHeader,
  CompactAlertCard,
  AlertRuleDetailModal,
  CreateAlertRuleModal,
} from "@components/organisms";

import { DataEmptyState } from "@/components/molecules/DataEmptyState";
import { DataErrorState } from "@/components/molecules/DataErrorState";
import { NotificationToast } from "@/components/molecules/NotificationToast";
import { Module, Action } from "@/constants/permissions";
import {
  useCreateAlertMessage,
  useUpdateAlertMessage,
  useDeleteAlertMessage,
  useDuplicateAlertMessage,
} from "@/hooks/useAlertMessages";
import {
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useToggleAlertRule,
} from "@/hooks/useAlertRules";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useMonitoringConditions } from "@/hooks/useMonitoringConditions";
import { useNotifications } from "@/hooks/useNotifications";
import type {
  AlertRule,
  NewMessageData,
  Message,
  SensorTypeValue,
  CreateAlertRuleData,
  UpdateAlertRuleData,
} from "@/types/alertRule";

function AlertRules() {
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const hasCreatePermission = useHasPermission(
    Module.MEASUREMENT_ALERTS,
    Action.CREATE
  );

  const {
    alertRules,
    sensors,
    receptors,
    messageGroups,
    coloresTorreta,
    sensorTypes,
    operators,
    getColorValue,
    isLoading,
    error,
  } = useMonitoringConditions();

  const createAlertRuleMutation = useCreateAlertRule();
  const updateAlertRuleMutation = useUpdateAlertRule();
  const deleteAlertRuleMutation = useDeleteAlertRule();
  const toggleAlertRuleMutation = useToggleAlertRule();

  const createAlertMessageMutation = useCreateAlertMessage();
  const updateAlertMessageMutation = useUpdateAlertMessage();
  const deleteAlertMessageMutation = useDeleteAlertMessage();
  const duplicateAlertMessageMutation = useDuplicateAlertMessage();

  const { notifications, removeNotification, showSuccess, showError } =
    useNotifications();

  const getSensorIcon = (type: SensorTypeValue): React.ReactElement => {
    const sensorType = sensorTypes.find((s) => s.value === type);
    const IconComponent = sensorType?.icon ?? FaTemperatureHalf;
    const colorClass = sensorType?.color ?? "text-gray-400";

    return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateRule = async (
    name: string,
    sensorId: number,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => {
    try {
      const data: CreateAlertRuleData = {
        name,
        measurementId: sensorId,
        mode,
        operator: mode === "setpoint" ? operator : undefined,
        setpoint: mode === "setpoint" ? parseFloat(setpoint) : undefined,
        minValue: mode === "window" ? parseFloat(minValue) : undefined,
        maxValue: mode === "window" ? parseFloat(maxValue) : undefined,
        isEnabled: true,
      };

      await createAlertRuleMutation.mutateAsync(data);
      handleCloseCreateModal();
      showSuccess(
        "Regla creada",
        "La regla de alerta se ha creado exitosamente"
      );
    } catch (error) {
      console.error("Error creating alert rule:", error);
      showError("Error al crear regla", "No se pudo crear la regla de alerta");
    }
  };

  const handleOpenDetailModal = (rule: AlertRule) => {
    setSelectedRule(rule);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRule(null);
  };

  const handleEditRule = async (
    id: string,
    name: string,
    sensorId: number,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => {
    try {
      const data: UpdateAlertRuleData = {
        name,
        measurementId: sensorId,
        mode,
        operator: mode === "setpoint" ? operator : undefined,
        setpoint: mode === "setpoint" ? parseFloat(setpoint) : undefined,
        minValue: mode === "window" ? parseFloat(minValue) : undefined,
        maxValue: mode === "window" ? parseFloat(maxValue) : undefined,
      };

      await updateAlertRuleMutation.mutateAsync({ id, data });
      showSuccess(
        "Regla actualizada",
        "La regla de alerta se ha actualizado exitosamente"
      );
    } catch (error) {
      console.error("Error updating alert rule:", error);
      showError(
        "Error al actualizar regla",
        "No se pudo actualizar la regla de alerta"
      );
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteAlertRuleMutation.mutateAsync(id);
      showSuccess(
        "Regla eliminada",
        "La regla de alerta se ha eliminado exitosamente"
      );
    } catch (error) {
      console.error("Error deleting alert rule:", error);
      showError(
        "Error al eliminar regla",
        "No se pudo eliminar la regla de alerta"
      );
    }
  };

  const handleToggleEnabled = async (id: string) => {
    try {
      await toggleAlertRuleMutation.mutateAsync(id);
      showSuccess(
        "Estado actualizado",
        "El estado de la regla se ha actualizado exitosamente"
      );
    } catch (error) {
      console.error("Error toggling alert rule:", error);
      showError(
        "Error al cambiar estado",
        "No se pudo cambiar el estado de la regla"
      );
    }
  };

  const handleCreateMessage = async (
    ruleId: string,
    messageData: NewMessageData
  ) => {
    try {
      await createAlertMessageMutation.mutateAsync({
        alertRuleId: ruleId,
        data: messageData,
      });
      showSuccess(
        "Mensaje creado",
        "El mensaje de alerta se ha creado exitosamente"
      );
    } catch (error) {
      console.error("Error creating alert message:", error);
      showError(
        "Error al crear mensaje",
        "No se pudo crear el mensaje de alerta"
      );
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!selectedRule) return;

    try {
      await deleteAlertMessageMutation.mutateAsync({
        alertRuleId: selectedRule.id,
        messageId,
      });
      showSuccess(
        "Mensaje eliminado",
        "El mensaje de alerta se ha eliminado exitosamente"
      );
    } catch (error) {
      console.error("Error deleting alert message:", error);
      showError(
        "Error al eliminar mensaje",
        "No se pudo eliminar el mensaje de alerta"
      );
    }
  };

  const handleDuplicateMessage = async (messageId: number) => {
    if (!selectedRule) return;

    try {
      await duplicateAlertMessageMutation.mutateAsync({
        alertRuleId: selectedRule.id,
        messageId,
      });
      showSuccess(
        "Mensaje duplicado",
        "El mensaje de alerta se ha duplicado exitosamente"
      );
    } catch (error) {
      console.error("Error duplicating alert message:", error);
      showError(
        "Error al duplicar mensaje",
        "No se pudo duplicar el mensaje de alerta"
      );
    }
  };

  const handleUpdateMessage = async (
    messageId: number,
    updates: Partial<Message>
  ) => {
    if (!selectedRule) return;

    try {
      await updateAlertMessageMutation.mutateAsync({
        alertRuleId: selectedRule.id,
        messageId,
        data: updates,
      });
      showSuccess(
        "Mensaje actualizado",
        "El mensaje de alerta se ha actualizado exitosamente"
      );
    } catch (error) {
      console.error("Error updating alert message:", error);
      showError(
        "Error al actualizar mensaje",
        "No se pudo actualizar el mensaje de alerta"
      );
    }
  };

  if (isLoading) {
    return <LoadingState message="Cargando condiciones de monitoreo..." />;
  }

  if (error) {
    return (
      <DataErrorState
        error={error}
        type="server"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (alertRules.length === 0) {
    return (
      <div className="flex flex-col h-full p-6">
        <PageHeader
          action={
            hasCreatePermission
              ? {
                  label: "Agregar Condición",
                  icon: <FaTriangleExclamation className="w-5 h-5" />,
                  onClick: handleOpenCreateModal,
                }
              : undefined
          }
          description="Administra las reglas que definen cuándo se activan las alertas"
          title="Monitoreo de Condiciones"
        />

        <div className="mt-6 flex-1 overflow-y-auto dark-scrollbar pr-2">
          <DataEmptyState
            action={
              hasCreatePermission
                ? {
                    label: "Crear Primera Regla",
                    onClick: handleOpenCreateModal,
                    variant: "primary",
                  }
                : undefined
            }
            description="No se han configurado reglas de alerta para monitorear las condiciones de los equipos."
            icon={FaTriangleExclamation}
            title="Aún no existen condiciones de alerta"
          />
        </div>

        {/* Modal de creación */}
        <CreateAlertRuleModal
          isOpen={isCreateModalOpen}
          operators={operators}
          sensorTypes={sensorTypes}
          sensors={sensors}
          onClose={handleCloseCreateModal}
          onCreate={handleCreateRule}
        />

        {/* Notification Toasts */}
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            duration={notification.duration}
            message={notification.message}
            title={notification.title}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <PageHeader
        action={
          hasCreatePermission
            ? {
                label: "Agregar Condición",
                icon: <FaTriangleExclamation className="w-5 h-5" />,
                onClick: handleOpenCreateModal,
              }
            : undefined
        }
        description="Administra las reglas que definen cuándo se activan las alertas"
        title="Monitoreo de Condiciones"
      />

      <div className="mt-6 flex-1 overflow-y-auto dark-scrollbar pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertRules.map((rule) => (
            <CompactAlertCard
              key={rule.id}
              getSensorIcon={getSensorIcon}
              rule={rule}
              sensor={sensors.find((s) => s.id === rule.measurementId)}
              sensorTypes={sensorTypes}
              onClick={handleOpenDetailModal}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </div>
      </div>

      {/* Modal de detalle/edición */}
      <AlertRuleDetailModal
        coloresTorreta={coloresTorreta}
        getColorValue={getColorValue}
        getSensorIcon={getSensorIcon}
        gruposMensajes={messageGroups}
        isOpen={isDetailModalOpen}
        operators={operators}
        receptores={receptors}
        rule={selectedRule}
        sensorTypes={sensorTypes}
        sensors={sensors}
        usuariosCorreo={receptors} // Using receptors as email users for now
        onClose={handleCloseDetailModal}
        onCreateMessage={handleCreateMessage}
        onDelete={handleDeleteRule}
        onDeleteMessage={handleDeleteMessage}
        onDuplicateMessage={handleDuplicateMessage}
        onEdit={handleEditRule}
        onToggleEnabled={handleToggleEnabled}
        onUpdateMessage={handleUpdateMessage}
      />

      {/* Modal de creación */}
      <CreateAlertRuleModal
        isOpen={isCreateModalOpen}
        operators={operators}
        sensorTypes={sensorTypes}
        sensors={sensors}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateRule}
      />

      {/* Notification Toasts */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          duration={notification.duration}
          message={notification.message}
          title={notification.title}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

export default AlertRules;
