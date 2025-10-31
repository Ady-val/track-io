import React, { useState } from "react";

import {
  useReceptors,
  useCreateReceptor,
  useUpdateReceptor,
  useDeleteReceptor,
  type Receptor,
} from "@/hooks/useCatalogs";

import { useModalError } from "@/hooks/useModalError";

import { Button } from "../../atoms/Button";
import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Modal } from "../Modal";

export function ReceptorsCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReceptor, setSelectedReceptor] = useState<Receptor | null>(
    null
  );
  const [formData, setFormData] = useState({ externalId: "", name: "" });
  const [formErrors, setFormErrors] = useState<{
    externalId?: string;
    name?: string;
  }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");

  const { data: receptorsData, isLoading } = useReceptors({
    active: undefined,
  });

  const createReceptorMutation = useCreateReceptor();
  const updateReceptorMutation = useUpdateReceptor();
  const deleteReceptorMutation = useDeleteReceptor();

  const receptors = receptorsData?.data ?? [];
  const filteredReceptors = receptors.filter(
    (receptor: { name: string; externalId: string }) =>
      receptor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receptor.externalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Array<TableColumn<Receptor>> = [
    {
      id: "id",
      label: "ID",
      key: "id",
      width: "80px",
    },
    {
      id: "externalId",
      label: "ID Externo",
      key: "externalId",
    },
    {
      id: "name",
      label: "Nombre",
      key: "name",
      width: "100%",
    },
    {
      id: "isActive",
      label: "Estado",
      key: "isActive",
      component: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const handleCreate = () => {
    setFormData({ externalId: "", name: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (receptor: Receptor) => {
    setSelectedReceptor(receptor);
    setFormData({ externalId: receptor.externalId, name: receptor.name });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleDelete = (receptor: Receptor) => {
    setSelectedReceptor(receptor);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { externalId?: string; name?: string } = {};

    if (!formData.externalId.trim()) {
      errors.externalId = "El ID externo es requerido";
    }
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
        await createReceptorMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedReceptor) {
        await updateReceptorMutation.mutateAsync({
          id: selectedReceptor.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ externalId: "", name: "" });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar el receptor");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedReceptor) {
      try {
        await deleteReceptorMutation.mutateAsync(selectedReceptor.id);
        setIsDeleteModalOpen(false);
        setSelectedReceptor(null);
      } catch (error) {
        console.error("Error deleting receptor:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ externalId: "", name: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedReceptor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar receptores..."
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
          Crear Receptor
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredReceptors}
        emptyMessage="No hay receptores registrados"
        loading={isLoading}
        maxHeight="max-h-96"
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={isCreateModalOpen ? "Crear Receptor" : "Editar Receptor"}
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
            error={formErrors.externalId}
            label="ID Externo"
            name="externalId"
            placeholder="Ingresa el ID externo del receptor"
            value={formData.externalId}
            onChange={(value) =>
              setFormData({ ...formData, externalId: value as string })
            }
          />

          <FormField
            required
            error={formErrors.name}
            label="Nombre"
            name="name"
            placeholder="Ingresa el nombre del receptor"
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
                createReceptorMutation.isPending ||
                updateReceptorMutation.isPending
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
                createReceptorMutation.isPending ||
                updateReceptorMutation.isPending
              }
              size="md"
              type="submit"
              variant="solid"
            >
              {createReceptorMutation.isPending ||
              updateReceptorMutation.isPending
                ? "Guardando..."
                : isCreateModalOpen
                  ? "Crear"
                  : "Actualizar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        cancelText="Cancelar"
        confirmText="Eliminar"
        isOpen={isDeleteModalOpen}
        loading={deleteReceptorMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedReceptor?.name}"?`}
        title="Eliminar Receptor"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
