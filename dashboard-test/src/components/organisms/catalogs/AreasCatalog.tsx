import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  type Area,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import { createAreaSchema, updateAreaSchema } from "@/lib/validations/schemas";

import { Button, ErrorMessage, Input, ValidationErrorList } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";

import { AreaTorretaConfigModal } from "./AreaTorretaConfigModal";

export function AreasCatalog() {
  const hasCreate = useHasPermission(Module.CATALOGS, Action.CREATE);
  const hasUpdate = useHasPermission(Module.CATALOGS, Action.UPDATE);
  const hasDelete = useHasPermission(Module.CATALOGS, Action.DELETE);
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

  // Form para crear
  const createForm = useFormValidation({
    schema: createAreaSchema,
    defaultValues: {
      name: "",
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Área creada exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateAreaSchema,
    defaultValues: {
      name: selectedArea?.name ?? "",
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Área actualizada exitosamente",
  });

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
    createForm.resetForm({ name: "" });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (area: Area) => {
    setSelectedArea(area);
    editForm.resetForm({ name: area.name });
    setIsEditModalOpen(true);
  };

  const handleDelete = (area: Area) => {
    setSelectedArea(area);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createAreaMutation.mutateAsync(data);
      createForm.toast.success("Área creada exitosamente");
      createForm.resetForm({ name: "" });
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selectedArea) return;

    try {
      editForm.clearAllErrors();
      // Asegurar que data tenga name como string, no undefined
      const updateData = {
        name: data.name ?? selectedArea.name,
      };

      await updateAreaMutation.mutateAsync({
        id: selectedArea.id,
        data: updateData,
      });
      editForm.toast.success("Área actualizada exitosamente");
      editForm.resetForm({ name: updateData.name });
      setIsEditModalOpen(false);
      setSelectedArea(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (selectedArea) {
      try {
        await deleteAreaMutation.mutateAsync(selectedArea.id);
        setIsDeleteModalOpen(false);
        setSelectedArea(null);
      } catch {
        // El error se maneja automáticamente por la mutación
      }
    }
  };

  const handleCancel = () => {
    createForm.resetForm({ name: "" });
    if (selectedArea?.name) {
      editForm.resetForm({ name: selectedArea.name });
    }
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedArea(null);
  };

  const isCreateLoading = createAreaMutation.isPending;
  const isEditLoading = updateAreaMutation.isPending;

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
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-area-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Área
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={areas}
          data-cy="areas-table"
          emptyMessage="No hay áreas registradas"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
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

      {/* Modal de Crear */}
      <Modal
        data-cy="create-area-modal"
        isOpen={isCreateModalOpen}
        title="Crear Área"
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          {createForm.modalError.validationErrors.length > 0 && (
            <ValidationErrorList
              errors={createForm.modalError.validationErrors}
            />
          )}

          {createForm.modalError.serverError && (
            <ErrorMessage
              isServerError={
                createForm.modalError.parsedError?.isServerError ?? false
              }
              message={createForm.modalError.serverError}
              type="server"
            />
          )}

          <div>
            <Controller
              control={createForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre del área"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="name"
                  />
                </>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={isCreateLoading}
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
                isCreateLoading || createForm.form.formState.isSubmitting
              }
              isLoading={isCreateLoading}
              size="md"
              type="submit"
              variant="solid"
            >
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Editar */}
      <Modal
        data-cy="edit-area-modal"
        isOpen={isEditModalOpen}
        title="Editar Área"
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          {editForm.modalError.validationErrors.length > 0 && (
            <ValidationErrorList
              errors={editForm.modalError.validationErrors}
            />
          )}

          {editForm.modalError.serverError && (
            <ErrorMessage
              isServerError={
                editForm.modalError.parsedError?.isServerError ?? false
              }
              message={editForm.modalError.serverError}
              type="server"
            />
          )}

          <div>
            <Controller
              control={editForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre del área"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="name"
                  />
                </>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={isEditLoading}
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
              disabled={isEditLoading || editForm.form.formState.isSubmitting}
              isLoading={isEditLoading}
              size="md"
              type="submit"
              variant="solid"
            >
              Actualizar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        cancelText="Cancelar"
        confirmText="Eliminar"
        data-cy="delete-area-confirmation-modal"
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
