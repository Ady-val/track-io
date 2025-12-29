import React, { useState } from "react";

import { Module, Action } from "@/constants/permissions";
import {
  useTorretas,
  useCreateTorreta,
  useUpdateTorreta,
  useDeleteTorreta,
  type Torreta,
} from "@/hooks/useCatalogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useModalError } from "@/hooks/useModalError";

import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { Button } from "../../atoms/Button";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Modal } from "../Modal";

export function TorretasCatalog() {
  const hasCreate = useHasPermission(Module.CATALOGS, Action.CREATE);
  const hasUpdate = useHasPermission(Module.CATALOGS, Action.UPDATE);
  const hasDelete = useHasPermission(Module.CATALOGS, Action.DELETE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTorreta, setSelectedTorreta] = useState<Torreta | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    externalId: "",
  });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");

  const { data: torretasData, isLoading } = useTorretas({
    active: undefined,
  });

  const createTorretaMutation = useCreateTorreta();
  const updateTorretaMutation = useUpdateTorreta();
  const deleteTorretaMutation = useDeleteTorreta();

  const torretas = torretasData?.data ?? [];
  const filteredTorretas = torretas.filter((torreta: { name: string }) =>
    torreta.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Array<TableColumn<Torreta>> = [
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
    },
    {
      id: "externalId",
      label: "External ID",
      key: "externalId",
      width: "200px",
      component: (value) => (value as string | undefined) ?? "-",
    },
    {
      id: "description",
      label: "Descripción",
      key: "description",
      component: (value) => (value as string | undefined) ?? "-",
    },
  ];

  const handleCreate = () => {
    setFormData({ name: "", description: "", externalId: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (torreta: Torreta) => {
    setSelectedTorreta(torreta);
    setFormData({
      name: torreta.name,
      description: torreta.description ?? "",
      externalId: torreta.externalId ?? "",
    });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleDelete = (torreta: Torreta) => {
    setSelectedTorreta(torreta);
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

      // Clean optional fields: convert empty strings to undefined
      const cleanedData = {
        name: formData.name,
        description: formData.description.trim() || undefined,
        externalId: formData.externalId.trim() || undefined,
      };

      if (isCreateModalOpen) {
        await createTorretaMutation.mutateAsync(cleanedData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedTorreta) {
        await updateTorretaMutation.mutateAsync({
          id: selectedTorreta.id,
          data: cleanedData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ name: "", description: "", externalId: "" });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar la torreta");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedTorreta) {
      try {
        await deleteTorretaMutation.mutateAsync(selectedTorreta.id);
        setIsDeleteModalOpen(false);
        setSelectedTorreta(null);
      } catch {
        errorHandling.setServerError("Error al eliminar la torreta");
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", externalId: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTorreta(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar torretas..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-torreta-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Torreta
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={filteredTorretas}
          data-cy="torretas-table"
          emptyMessage="No hay torretas registradas"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
        />
      </div>

      <Modal
        data-cy={
          isCreateModalOpen ? "create-torreta-modal" : "edit-torreta-modal"
        }
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={isCreateModalOpen ? "Crear Torreta" : "Editar Torreta"}
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
            placeholder="Ingresa el nombre de la torreta"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <FormField
            label="External ID"
            name="externalId"
            placeholder="Ingresa el External ID de la torreta (opcional)"
            value={formData.externalId}
            onChange={(value) =>
              setFormData({ ...formData, externalId: value as string })
            }
          />

          <FormField
            label="Descripción"
            name="description"
            placeholder="Ingresa la descripción de la torreta (opcional)"
            value={formData.description}
            onChange={(value) =>
              setFormData({ ...formData, description: value as string })
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={
                createTorretaMutation.isPending ||
                updateTorretaMutation.isPending
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
                createTorretaMutation.isPending ||
                updateTorretaMutation.isPending
              }
              size="md"
              type="submit"
              variant="solid"
            >
              {createTorretaMutation.isPending ||
              updateTorretaMutation.isPending
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
        data-cy="delete-torreta-confirmation-modal"
        isOpen={isDeleteModalOpen}
        loading={deleteTorretaMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedTorreta?.name}"?`}
        title="Eliminar Torreta"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
