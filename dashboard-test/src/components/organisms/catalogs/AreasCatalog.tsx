import React, { useState } from "react";

import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  type Area,
} from "@/hooks/useCatalogs";
import { useModalError } from "@/hooks/useModalError";

import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { Button } from "../../atoms/Button";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";
import { AreaTorretaConfigModal } from "./AreaTorretaConfigModal";

export function AreasCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTorretaConfigModalOpen, setIsTorretaConfigModalOpen] =
    useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedAreaForTorreta, setSelectedAreaForTorreta] =
    useState<Area | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");

  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  const { data: areasData, isLoading } = useAreas({
    limit: itemsPerPage,
    offset,
    name: searchTerm || undefined,
  });

  const createAreaMutation = useCreateArea();
  const updateAreaMutation = useUpdateArea();
  const deleteAreaMutation = useDeleteArea();

  const areas = areasData?.data ?? [];
  const totalItems = areasData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleTorretaConfig = (area: Area) => {
    setSelectedAreaForTorreta(area);
    setIsTorretaConfigModalOpen(true);
  };

  const columns: Array<TableColumn<Area>> = [
    {
      id: "id",
      label: "ID",
      key: "id",
      width: "80px",
    },
    {
      id: "name",
      label: "Nombre",
      key: "name",
      width: "100%",
    },
    {
      id: "torretas",
      label: "Torretas",
      key: "name", // Usamos 'name' como key pero component renderiza el botón
      width: "120px",
      component: (_value, row) => (
        <Button
          color="primary"
          size="sm"
          variant="bordered"
          onClick={() => handleTorretaConfig(row)}
        >
          Configurar
        </Button>
      ),
    },
  ];

  const handleCreate = () => {
    setFormData({ name: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (area: Area) => {
    setSelectedArea(area);
    setFormData({ name: area.name });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleDelete = (area: Area) => {
    setSelectedArea(area);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string } = {};

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      errorHandling.setValidationErrors(
        Object.values(errors).filter((err): err is string => !!err)
      );

      return;
    }

    try {
      errorHandling.clearErrors();

      if (isCreateModalOpen) {
        await createAreaMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedArea) {
        await updateAreaMutation.mutateAsync({
          id: selectedArea.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ name: "" });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar el área");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedArea) {
      try {
        await deleteAreaMutation.mutateAsync(selectedArea.id);
        setIsDeleteModalOpen(false);
        setSelectedArea(null);
      } catch (error) {
        console.error("Error deleting area:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedArea(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar áreas..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          className="ml-4"
          color="primary"
          size="lg"
          onClick={handleCreate}
        >
          Crear Área
        </Button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={areas}
          emptyMessage="No hay áreas registradas"
          loading={isLoading}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex-shrink-0 mt-4">
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={isCreateModalOpen ? "Crear Área" : "Editar Área"}
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {errorHandling.validationErrors.length > 0 && (
            <ValidationErrorList errors={errorHandling.validationErrors} />
          )}

          {errorHandling.serverError && (
            <ErrorMessage
              isServerError={errorHandling.parsedError?.isServerError ?? false}
              message={errorHandling.serverError}
              type="server"
            />
          )}

          <FormField
            autoFocus
            required
            error={formErrors.name}
            label="Nombre"
            name="name"
            placeholder="Ingresa el nombre del área"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={
                createAreaMutation.isPending || updateAreaMutation.isPending
              }
              size="md"
              type="button"
              variant="solid"
              onPress={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              className="px-6 py-2 font-semibold"
              color="primary"
              disabled={
                createAreaMutation.isPending || updateAreaMutation.isPending
              }
              size="md"
              type="submit"
              variant="solid"
            >
              {createAreaMutation.isPending || updateAreaMutation.isPending
                ? "Guardando..."
                : isCreateModalOpen
                  ? "Crear"
                  : "Actualizar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        cancelText="Cancelar"
        confirmText="Eliminar"
        isOpen={isDeleteModalOpen}
        loading={deleteAreaMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedArea?.name}"?`}
        title="Eliminar Área"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      <AreaTorretaConfigModal
        area={selectedAreaForTorreta}
        isOpen={isTorretaConfigModalOpen}
        onClose={() => {
          setIsTorretaConfigModalOpen(false);
          setSelectedAreaForTorreta(null);
        }}
      />
    </div>
  );
}
