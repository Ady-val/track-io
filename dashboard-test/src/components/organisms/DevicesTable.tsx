import type { Device } from "../../types/device";

import React, { useState } from "react";

import {
  FaChevronDown,
  FaChevronRight,
  FaMicrochip,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCog,
} from "react-icons/fa";

import { Module, Action } from "../../constants/permissions";
import { useHasPermission } from "../../hooks/useHasPermission";
import { Button } from "../atoms/Button";
import { Spinner } from "../atoms/Spinner";

interface DevicesTableProps {
  data: Device[];
  loading?: boolean;
  className?: string;
  onEditDevice?: (device: Device) => void;
  onDeleteDevice?: (device: Device) => void;
  onAddSignal?: (device: Device) => void;
  onEditSignal?: (
    signal: NonNullable<Device["deviceSignals"]>[0],
    device: Device
  ) => void;
  onDeleteSignal?: (
    signal: NonNullable<Device["deviceSignals"]>[0],
    device: Device
  ) => void;
  onConfigureEscalation?: (
    signal: NonNullable<Device["deviceSignals"]>[0],
    device: Device
  ) => void;
}

export const DevicesTable: React.FC<DevicesTableProps> = ({
  data,
  loading = false,
  className = "",
  onEditDevice,
  onDeleteDevice,
  onAddSignal,
  onEditSignal,
  onDeleteSignal,
  onConfigureEscalation,
}) => {
  const hasUpdatePermission = useHasPermission(Module.DEVICES, Action.UPDATE);
  const hasDeletePermission = useHasPermission(Module.DEVICES, Action.DELETE);
  const hasCreatePermission = useHasPermission(Module.DEVICES, Action.CREATE);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }

    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <div
        className={`bg-slate-900 rounded-xl shadow-lg border-2 border-slate-700 ${className}`}
      >
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center space-x-3">
            <Spinner color="primary" size="lg" />
            <span className="text-slate-300 text-lg">
              Cargando dispositivos...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-900 rounded-xl shadow-lg overflow-hidden border-2 border-slate-700 flex flex-col ${className}`}
    >
      <div className="flex-1 overflow-y-auto overflow-x-auto table-scrollbar">
        <table className="w-full">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Dispositivo
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                External ID
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-slate-200 uppercase tracking-wider">
                Acciones
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-slate-200 uppercase tracking-wider">
                Señales
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-700">
            {data.map((device) => (
              <React.Fragment key={device.id}>
                <tr className="hover:bg-slate-800 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaMicrochip className="w-5 h-5 text-blue-500 mr-3" />
                      <div className="text-lg text-slate-300 font-medium">
                        {device.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg text-slate-300 font-medium">
                      {device.areaName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg text-slate-300 font-medium">
                      {device.externalId}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-center w-32">
                    <div className="flex items-center justify-center space-x-1">
                      {hasUpdatePermission && (
                        <Button
                          className="flex items-center justify-center w-8 h-8 font-semibold text-white"
                          color="warning"
                          size="sm"
                          title="Editar dispositivo"
                          variant="solid"
                          onPress={() => onEditDevice?.(device)}
                        >
                          <FaEdit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasCreatePermission && (
                        <Button
                          className="flex items-center justify-center w-8 h-8 font-semibold"
                          color="primary"
                          size="sm"
                          title="Agregar señal"
                          variant="solid"
                          onPress={() => onAddSignal?.(device)}
                        >
                          <FaPlus className="w-4 h-4" />
                        </Button>
                      )}
                      {hasDeletePermission && (
                        <Button
                          className="flex items-center justify-center w-8 h-8 font-semibold"
                          color="danger"
                          size="sm"
                          title="Eliminar dispositivo"
                          variant="solid"
                          onPress={() => onDeleteDevice?.(device)}
                        >
                          <FaTrash className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      className="flex items-center justify-center w-full text-slate-300 hover:text-white transition-colors duration-200 group"
                      onClick={() => toggleRow(device.id)}
                    >
                      {expandedRows.has(device.id) ? (
                        <FaChevronDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      ) : (
                        <FaChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      )}
                      <span className="ml-2 font-medium">
                        {device.deviceSignals?.length ?? 0}
                      </span>
                    </button>
                  </td>
                </tr>

                {expandedRows.has(device.id) &&
                  device.deviceSignals &&
                  device.deviceSignals.length > 0 && (
                    <tr>
                      <td className="px-0 py-0" colSpan={5}>
                        <div className="bg-slate-800/50 border-t border-slate-600">
                          <div className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider border-b border-slate-600 pb-2">
                              Señales del Dispositivo
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-800/30">
                              <table className="w-full">
                                <thead className="bg-slate-700">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                      Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                      Departamento
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                      External Value ID
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-200 uppercase tracking-wider">
                                      Acciones
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-slate-800/40 divide-y divide-slate-600">
                                  {device.deviceSignals.map((signal) => (
                                    <tr
                                      key={signal.id}
                                      className="hover:bg-slate-600/50 transition-colors duration-200"
                                    >
                                      <td className="px-4 py-3 text-sm text-slate-300">
                                        {signal.name}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-300">
                                        {signal.departmentName}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-300">
                                        {signal.externalValueId}
                                      </td>
                                      <td className="px-2 py-3 text-center w-32">
                                        <div className="flex items-center justify-center space-x-1">
                                          {hasUpdatePermission && (
                                            <Button
                                              className="flex items-center justify-center w-8 h-8 font-semibold text-white"
                                              color="warning"
                                              size="sm"
                                              title="Editar señal"
                                              variant="solid"
                                              onPress={() =>
                                                onEditSignal?.(signal, device)
                                              }
                                            >
                                              <FaEdit className="w-4 h-4" />
                                            </Button>
                                          )}
                                          {hasUpdatePermission && (
                                            <Button
                                              className="flex items-center justify-center w-8 h-8 font-semibold"
                                              color="primary"
                                              size="sm"
                                              title="Configurar escalamientos"
                                              variant="solid"
                                              onPress={() =>
                                                onConfigureEscalation?.(
                                                  signal,
                                                  device
                                                )
                                              }
                                            >
                                              <FaCog className="w-4 h-4" />
                                            </Button>
                                          )}
                                          {hasDeletePermission && (
                                            <Button
                                              className="flex items-center justify-center w-8 h-8 font-semibold"
                                              color="danger"
                                              size="sm"
                                              title="Eliminar señal"
                                              variant="solid"
                                              onPress={() =>
                                                onDeleteSignal?.(signal, device)
                                              }
                                            >
                                              <FaTrash className="w-4 h-4" />
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                {expandedRows.has(device.id) &&
                  (!device.deviceSignals ||
                    device.deviceSignals.length === 0) && (
                    <tr>
                      <td className="px-0 py-0" colSpan={5}>
                        <div className="bg-slate-800/50 border-t border-slate-600">
                          <div className="px-6 py-8 text-center">
                            <div className="text-slate-400 text-sm">
                              No hay señales asociadas a este dispositivo
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
