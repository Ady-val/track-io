import React from "react";

const ContextualActions = ({
  event,
  onViewHistory,
  onViewRelated,
  onViewProcedures,
  onConfigure,
  onViewAnalytics,
}) => {
  const actions = [
    {
      id: "history",
      title: "Ver Historial",
      description: "Revisar eventos similares anteriores",
      icon: "📊",
      action: () => onViewHistory(event),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "related",
      title: "Eventos Relacionados",
      description: "Mostrar eventos relacionados en otras líneas",
      icon: "🔗",
      action: () => onViewRelated(event),
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      id: "procedures",
      title: "Procedimientos",
      description: "Abrir manual de procedimientos",
      icon: "📋",
      action: () => onViewProcedures(event),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      id: "analytics",
      title: "Analíticas",
      description: "Ver análisis detallado del evento",
      icon: "📈",
      action: () => onViewAnalytics(event),
      color: "bg-orange-600 hover:bg-orange-700",
    },
    {
      id: "configure",
      title: "Configurar",
      description: "Ajustar parámetros del sistema",
      icon: "⚙️",
      action: () => onConfigure(event),
      color: "bg-gray-600 hover:bg-gray-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.action}
          className={`${action.color} text-white p-6 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
        >
          <div className="flex items-start space-x-4">
            <div className="text-3xl group-hover:scale-110 transition-transform">
              {action.icon}
            </div>
            <div className="text-left">
              <h4 className="text-lg font-semibold mb-2">{action.title}</h4>
              <p className="text-sm opacity-90">{action.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ContextualActions;
