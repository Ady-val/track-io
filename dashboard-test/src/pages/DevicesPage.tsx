import type { Device } from "../types/device";
import type { DeviceSignal } from "../types/device-signal";

import React, { useState } from "react";

import { FaMicrochip, FaPlus } from "react-icons/fa";

import { Button } from "../components/atoms/Button";
import { Text } from "../components/atoms/Text";
import {
  DevicesTable,
  CreateDeviceWithSignalsModal,
  EditDeviceModal,
  AddSignalModal,
  DeleteDeviceModal,
  EditSignalModal,
  DeleteSignalModal,
  EscalationConfigModal,
} from "../components/organisms";
import { Module, Action } from "../constants/permissions";
import { useDevices } from "../hooks/useDevices";
import { useHasPermission } from "../hooks/useHasPermission";

export const DevicesPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useDevices({ limit: 50 });
  const hasCreatePermission = useHasPermission(Module.DEVICES, Action.CREATE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDeviceModalOpen, setIsEditDeviceModalOpen] = useState(false);
  const [isAddSignalModalOpen, setIsAddSignalModalOpen] = useState(false);
  const [isDeleteDeviceModalOpen, setIsDeleteDeviceModalOpen] = useState(false);
  const [isEditSignalModalOpen, setIsEditSignalModalOpen] = useState(false);
  const [isDeleteSignalModalOpen, setIsDeleteSignalModalOpen] = useState(false);
  const [isEscalationConfigModalOpen, setIsEscalationConfigModalOpen] =
    useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<DeviceSignal | null>(
    null
  );

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
              <FaMicrochip className="w-6 h-6 text-white" />
            </div>
            <div>
              <Text color="primary" variant="h2">
                Dispositivos y Señales
              </Text>
              <Text className="mt-1" color="muted" variant="caption">
                Gestión de dispositivos y sus señales asociadas
              </Text>
            </div>
          </div>
          {hasCreatePermission && (
            <Button
              className="flex items-center space-x-2"
              color="primary"
              data-cy="add-device-button"
              variant="solid"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <FaPlus className="w-4 h-4" />
              <span>Agregar Dispositivo</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 px-8 pb-8">
        {error && (
          <div className="flex-shrink-0 mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <Text color="danger">
              Error al cargar los datos: {error.message}
            </Text>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <DevicesTable
            className="h-full"
            data={data?.data ?? []}
            loading={isLoading}
            onAddSignal={(device) => {
              setSelectedDevice(device);
              setIsAddSignalModalOpen(true);
            }}
            onConfigureEscalation={(signal, device) => {
              setSelectedSignal(signal);
              setSelectedDevice(device);
              setIsEscalationConfigModalOpen(true);
            }}
            onDeleteDevice={(device) => {
              setSelectedDevice(device);
              setIsDeleteDeviceModalOpen(true);
            }}
            onDeleteSignal={(signal, device) => {
              setSelectedSignal({
                id: signal.id,
                name: signal.name,
                deviceId: device.id,
                departmentId: signal.departmentId,
                externalValueId: signal.externalValueId,
                createdAt: "",
                updatedAt: "",
                department: signal.departmentName
                  ? {
                      id: signal.departmentId,
                      name: signal.departmentName,
                    }
                  : undefined,
              });
              setSelectedDevice(device);
              setIsDeleteSignalModalOpen(true);
            }}
            onEditDevice={(device) => {
              setSelectedDevice(device);
              setIsEditDeviceModalOpen(true);
            }}
            onEditSignal={(signal, device) => {
              setSelectedSignal({
                id: signal.id,
                name: signal.name,
                deviceId: device.id,
                departmentId: signal.departmentId,
                externalValueId: signal.externalValueId,
                createdAt: "",
                updatedAt: "",
                department: signal.departmentName
                  ? {
                      id: signal.departmentId,
                      name: signal.departmentName,
                    }
                  : undefined,
              });
              setSelectedDevice(device);
              setIsEditSignalModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateDeviceWithSignalsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditDeviceModal
        device={selectedDevice}
        isOpen={isEditDeviceModalOpen}
        onClose={() => setIsEditDeviceModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <AddSignalModal
        device={selectedDevice}
        isOpen={isAddSignalModalOpen}
        onClose={() => setIsAddSignalModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <DeleteDeviceModal
        device={selectedDevice}
        isOpen={isDeleteDeviceModalOpen}
        onClose={() => setIsDeleteDeviceModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditSignalModal
        device={selectedDevice}
        isOpen={isEditSignalModalOpen}
        signal={selectedSignal}
        onClose={() => setIsEditSignalModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <DeleteSignalModal
        device={selectedDevice}
        isOpen={isDeleteSignalModalOpen}
        signal={selectedSignal}
        onClose={() => setIsDeleteSignalModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <EscalationConfigModal
        key={`${selectedDevice?.id}-${selectedSignal?.id}`}
        device={selectedDevice}
        isOpen={isEscalationConfigModalOpen}
        signal={selectedSignal}
        onClose={() => setIsEscalationConfigModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
