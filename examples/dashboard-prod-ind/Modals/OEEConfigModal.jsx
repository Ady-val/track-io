import React, { useState, useEffect } from "react";

const OEEConfigModal = ({ isOpen, onClose, lineData, onSave }) => {
  const [config, setConfig] = useState({
    desiredOperatingTime: 0,
    desiredSpeed: 0,
    targetQuality: 100,
    plannedDowntime: 0,
    unplannedDowntime: 0,
  });

  useEffect(() => {
    if (lineData) {
      // Load existing configuration if available
      setConfig({
        desiredOperatingTime: lineData.desiredOperatingTime || 0,
        desiredSpeed: lineData.desiredSpeed || 0,
        targetQuality: lineData.targetQuality || 100,
        plannedDowntime: lineData.plannedDowntime || 0,
        unplannedDowntime: lineData.unplannedDowntime || 0,
      });
    }
  }, [lineData]);

  const handleSave = () => {
    onSave({
      lineId: lineData?.id,
      lineName: lineData?.name,
      ...config,
    });
    onClose();
  };

  const handleInputChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-100">
            Configuración OEE - {lineData?.name}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tiempo de Operación Deseado (horas)
              </label>
              <input
                type="number"
                value={config.desiredOperatingTime}
                onChange={(e) =>
                  handleInputChange("desiredOperatingTime", e.target.value)
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Velocidad Deseada (piezas/hora)
              </label>
              <input
                type="number"
                value={config.desiredSpeed}
                onChange={(e) =>
                  handleInputChange("desiredSpeed", e.target.value)
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Calidad Objetivo (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.targetQuality}
                onChange={(e) =>
                  handleInputChange("targetQuality", e.target.value)
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="95"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tiempo de Parada Planificada (horas)
              </label>
              <input
                type="number"
                value={config.plannedDowntime}
                onChange={(e) =>
                  handleInputChange("plannedDowntime", e.target.value)
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.5"
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-slate-200 mb-3">
              Información OEE
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Disponibilidad:</span>
                <div className="text-slate-200 font-medium">
                  {(
                    ((config.desiredOperatingTime - config.plannedDowntime) /
                      config.desiredOperatingTime) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
              <div>
                <span className="text-slate-400">Rendimiento:</span>
                <div className="text-slate-200 font-medium">
                  {config.desiredSpeed > 0 ? "100%" : "0%"}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Calidad:</span>
                <div className="text-slate-200 font-medium">
                  {config.targetQuality}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default OEEConfigModal;
