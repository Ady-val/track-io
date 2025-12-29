import React from "react";

import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

export interface TableColumn<T = Record<string, unknown>> {
  id: string;
  label: string;
  key: keyof T;
  component?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: Array<TableColumn<T>>;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
  "data-cy"?: string;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  className = "",
  maxHeight,
  "data-cy": dataCy,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">{emptyMessage}</div>
    );
  }

  if (maxHeight) {
    return (
      <div className={`flex flex-col ${maxHeight} ${className}`}>
        <div className="flex-1 overflow-x-auto overflow-y-auto table-scrollbar">
          <table
            className="min-w-full bg-slate-700 border border-slate-600 rounded-lg"
            data-cy={dataCy || "data-table"}
            style={{ tableLayout: "fixed" }}
          >
            <thead className="bg-slate-800 sticky top-0 z-10 shadow-md">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-800"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
                {(onEdit ?? onDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-800">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-slate-700 divide-y divide-slate-600">
              {data.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-600"
                  data-cy="table-row"
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-200"
                      style={{ width: column.width }}
                    >
                      {column.component
                        ? column.component(row[column.key], row)
                        : String(row[column.key] ?? "")}
                    </td>
                  ))}
                  {(onEdit ?? onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {onEdit && (
                          <Button
                            data-cy="edit-row-button"
                            disableRipple
                            className="text-blue-400 hover:text-blue-300 border-slate-600 hover:border-blue-400"
                            size="sm"
                            variant="bordered"
                            onClick={() => onEdit(row)}
                          >
                            <Icon className="w-4 h-4" name="edit" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            data-cy="delete-row-button"
                            disableRipple
                            className="text-red-400 hover:text-red-300 border-slate-600 hover:border-red-400"
                            size="sm"
                            variant="bordered"
                            onClick={() => onDelete(row)}
                          >
                            <Icon className="w-4 h-4" name="trash" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto overflow-x-auto table-scrollbar">
        <table
          className="min-w-full bg-slate-700 border border-slate-600 rounded-lg"
          data-cy={dataCy || "data-table"}
          style={{ tableLayout: "fixed" }}
        >
          <thead className="bg-slate-800 sticky top-0 z-10 shadow-md">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-800"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {(onEdit ?? onDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-800">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-slate-700 divide-y divide-slate-600">
            {data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-600"
                data-cy="table-row"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-200"
                    style={{ width: column.width }}
                  >
                    {column.component
                      ? column.component(row[column.key], row)
                      : String(row[column.key] ?? "")}
                  </td>
                ))}
                {(onEdit ?? onDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {onEdit && (
                        <Button
                          data-cy="edit-row-button"
                          disableRipple
                          className="text-blue-400 hover:text-blue-300 border-slate-600 hover:border-blue-400"
                          size="sm"
                          variant="bordered"
                          onClick={() => onEdit(row)}
                        >
                          <Icon className="w-4 h-4" name="edit" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          data-cy="delete-row-button"
                          disableRipple
                          className="text-red-400 hover:text-red-300 border-slate-600 hover:border-red-400"
                          size="sm"
                          variant="bordered"
                          onClick={() => onDelete(row)}
                        >
                          <Icon className="w-4 h-4" name="trash" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
