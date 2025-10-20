import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventColors } from "../config/dictionaries";
import io from "socket.io-client";
import { apiURL, request } from "../api/request";
import ProductionDashboard from "./ProductionDashboard.jsx";

function Dashboard() {
  const req = request();
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [enhancedData, setEnhancedData] = useState({
    lines: [],
    departments: [
      { name: "Ingeniería", color: "#3B82F6" },
      { name: "Mantenimiento", color: "#F59E0B" },
      { name: "Calidad", color: "#EF4444" },
      { name: "Producción", color: "#10B981" },
      { name: "Logística", color: "#8B5CF6" },
    ],
  });

  // Mock data for demonstration
  const mockData = {
    lines: [
      {
        id: "1",
        name: "Línea de Producción A",
        availability: 95,
        events: [
          {
            id: "1",
            title: "Falla en Motor Principal",
            line: "Línea de Producción A",
            department: "Mantenimiento",
            status: "open",
            start: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            priority: "high",
          },
          {
            id: "2",
            title: "Control de Calidad Pendiente",
            line: "Línea de Producción A",
            department: "Calidad",
            status: "in-progress",
            start: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            priority: "medium",
          },
        ],
      },
      {
        id: "2",
        name: "Línea de Producción B",
        availability: 87,
        events: [
          {
            id: "3",
            title: "Optimización de Proceso",
            line: "Línea de Producción B",
            department: "Ingeniería",
            status: "in-progress",
            start: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            priority: "low",
          },
        ],
      },
      {
        id: "3",
        name: "Línea de Producción C",
        availability: 72,
        events: [
          {
            id: "4",
            title: "Falla Crítica en Sistema",
            line: "Línea de Producción C",
            department: "Ingeniería",
            status: "open",
            start: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            priority: "critical",
          },
          {
            id: "5",
            title: "Revisión de Calidad",
            line: "Línea de Producción C",
            department: "Calidad",
            status: "open",
            start: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            priority: "medium",
          },
        ],
      },
    ],
    departments: [
      { name: "Ingeniería", color: "#3B82F6" },
      { name: "Mantenimiento", color: "#F59E0B" },
      { name: "Calidad", color: "#EF4444" },
      { name: "Producción", color: "#10B981" },
      { name: "Logística", color: "#8B5CF6" },
    ],
  };

  useEffect(() => {
    setEnhancedData(mockData);
  }, []);

  useEffect(async () => {
    try {
      const res = await req({
        url: "/api/dashboard/areas-data",
        method: "GET",
      });

      if (res?.data?.success) {
        setHeaders(res.data.headers);
        setData(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [setHeaders, setData]);

  const handleEventClick = (event) => {
    console.log("Event clicked:", event);
    // Navigate to event details or open modal
  };

  return <ProductionDashboard />;
}

const DashboardTable = ({ headers, data: externalData }) => {
  const [data, setData] = useState(externalData);
  const updateDataNewEvent = (area, status, department) => {
    const newData = data;
    const areaIndex = newData.findIndex((item) => item.area === area);
    if (areaIndex !== -1) {
      console.log(event);
      const departmentIndex = newData[areaIndex].departments.findIndex(
        (row) => row.department == department
      );
      newData[areaIndex].departments[departmentIndex].status = status;
      setData([]);
      setData(newData);
    }
  };

  const updateDataClosedEvent = (area, status, department, duration) => {
    const newData = data;
    const areaIndex = newData.findIndex((item) => item.area === area);
    if (areaIndex !== -1) {
      console.log(event);
      const departmentIndex = newData[areaIndex].departments.findIndex(
        (row) => row.department == department
      );
      newData[areaIndex].departments[departmentIndex].status = status;
      newData[areaIndex].duration = duration;
      setData([]);
      setData(newData);
    }
  };

  useEffect(() => {
    console.log("corre useEffect de sockets");
    console.log(data);
    const socket = io(apiURL, {
      withCredentials: true,
      extraHeaders: {
        // token: data.token,
      },
    });

    socket.on("connect", () => {
      socket.on("new-event", (event) => {
        console.log("corre new-event");
        const { area, status, department } = event;
        updateDataNewEvent(area, status, department);
      });
      socket.on("closed-event", (event) => {
        console.log("corre closed-event");
        const { area, status, department, duration } = event;
        updateDataClosedEvent(area, status, department, duration);
      });
    });
  }, []);
  const navigate = useNavigate();
  return (
    <div className="rounded-lg border p-2">
      <table className="w-full">
        <thead className="text-md text-white">
          <tr>
            <th
              key="area"
              className="px-2 py-1 font-normal"
            >
              Área
            </th>
            {headers.map((row) => {
              return (
                <th
                  key={row}
                  className="px-4 py-1 font-normal"
                >
                  {row}
                </th>
              );
            })}
            <th
              key="eventTime"
              className="px-2 py-1 font-normal"
            >
              Tiempo acumulado
            </th>
          </tr>
        </thead>
        <tbody className="text-center text-xl">
          {data.map((row, index) => {
            return (
              <tr
                key={index}
                onClick={() =>
                  navigate(`/panel/dashboard/departments/${row.area}`)
                }
                className="h-20 hover:bg-backgroundPrimary"
              >
                <td
                  key={"area" + index}
                  className="text-primaryText"
                >
                  {row.area}
                </td>
                {headers.map((header) => {
                  return (
                    <td
                      key={header + index}
                      className=""
                    >
                      <ColorAlert
                        event={
                          row.departments.find(
                            (department) => department.department == header
                          )?.status ?? "NA"
                        }
                      />
                    </td>
                  );
                })}
                <td
                  key={"eventTime" + index}
                  className="text-primaryText"
                >
                  {row.eventsTime}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ColorAlert = ({ event }) => {
  const [color, setColor] = useState(
    eventColors.find((eventColor) => eventColor.event == event).color
  );
  return (
    <div className="flex w-full justify-center">
      <div className={`h-16 w-16 rounded-full border ${color}`} />
    </div>
  );
};

export default Dashboard;
