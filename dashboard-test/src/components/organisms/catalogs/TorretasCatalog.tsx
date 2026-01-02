import { useState } from "react";
import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useTorretas,
  useCreateTorreta,
  useUpdateTorreta,
  useDeleteTorreta,
  type Torreta,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  createTorretaSchema,
  updateTorretaSchema,
} from "@/lib/validations/schemas";

import { Button, ErrorMessage, Input, ValidationErrorList } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
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

  // Form para crear
  const createForm = useFormValidation({
    schema: createTorretaSchema,
    defaultValues: {
      name: "",
      description: undefined,
      externalId: undefined,
      isActive: undefined,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Torreta creada exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateTorretaSchema,
    defaultValues: {
      name: selectedTorreta?.name ?? "",
      description: selectedTorreta?.description,
      externalId: selectedTorreta?.externalId,
      isActive: selectedTorreta?.isActive,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Torreta actualizada exitosamente",
  });

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
    createForm.resetForm({
      name: "",
      description: undefined,
      externalId: undefined,
      isActive: undefined,
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (torreta: Torreta) => {
    setSelectedTorreta(torreta);
    editForm.resetForm({
      name: torreta.name,
      description: torreta.description || undefined,
      externalId: torreta.externalId || undefined,
      isActive: torreta.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (torreta: Torreta) => {
    setSelectedTorreta(torreta);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      // Clean optional fields: convert empty strings to undefined
      const cleanedData = {
        name: data.name,
        description: data.description?.trim() || undefined,
        externalId: data.externalId?.trim() || undefined,
        isActive: data.isActive,
      };
      await createTorretaMutation.mutateAsync(cleanedData);
      createForm.toast.success("Torreta creada exitosamente");
      createForm.resetForm({
        name: "",
        description: undefined,
        externalId: undefined,
        isActive: undefined,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selectedTorreta) return;

    try {
      editForm.clearAllErrors();
      // Clean optional fields: convert empty strings to undefined
      const cleanedData = {
        name: data.name ?? selectedTorreta.name,
        description: data.description?.trim() || undefined,
        externalId: data.externalId?.trim() || undefined,
        isActive: data.isActive ?? selectedTorreta.isActive,
      };
      await updateTorretaMutation.mutateAsync({
        id: selectedTorreta.id,
        data: cleanedData,
      });
      editForm.toast.success("Torreta actualizada exitosamente");
      editForm.resetForm(cleanedData);
      setIsEditModalOpen(false);
      setSelectedTorreta(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (selectedTorreta) {
      try {
        await deleteTorretaMutation.mutateAsync(selectedTorreta.id);
        setIsDeleteModalOpen(false);
        setSelectedTorreta(null);
      } catch {
        // El error se maneja automáticamente por la mutación
      }
    }
  };

  const handleCancel = () => {
    createForm.resetForm({
      name: "",
      description: undefined,
      externalId: undefined,
      isActive: undefined,
    });
    if (selectedTorreta) {
      editForm.resetForm({
        name: selectedTorreta.name,
        description: selectedTorreta.description || undefined,
        externalId: selectedTorreta.externalId || undefined,
        isActive: selectedTorreta.isActive,
      });
    }
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTorreta(null);
  };

  const isCreateLoading = createTorretaMutation.isPending;
  const isEditLoading = updateTorretaMutation.isPending;

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

      {/* Modal de Crear */}
      <Modal
        data-cy="create-torreta-modal"
        isOpen={isCreateModalOpen}
        title="Crear Torreta"
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
              name="name"
              control={createForm.form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    errorMessage={fieldState.error?.message}
                    fullWidth
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre de la torreta"
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

          <div>
            <Controller
              name="description"
              control={createForm.form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    errorMessage={fieldState.error?.message}
                    fullWidth
                    isInvalid={!!fieldState.error}
                    label="Descripción (Opcional)"
                    labelPlacement="outside"
                    placeholder="Ingresa una descripción"
                    size="md"
                    value={field.value || ""}
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="description"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              name="externalId"
              control={createForm.form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    errorMessage={fieldState.error?.message}
                    fullWidth
                    isInvalid={!!fieldState.error}
                    label="External ID (Opcional)"
                    labelPlacement="outside"
                    placeholder="Ingresa el External ID"
                    size="md"
                    value={field.value || ""}
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="externalId"
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
        data-cy="edit-torreta-modal"
        isOpen={isEditModalOpen}
        title="Editar Torreta"
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
              name="name"
              control={editForm.form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    errorMessage={fieldState.error?.message}
                    fullWidth
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre de la torreta"
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

          <div>
            <Controller
              name="description"
              control={editForm.form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    errorMessage={fieldState.error?.message}
                    fullWidth
                    isInvalid={!!fieldState.error}
                    label="Descripción (Opcional)"
                    labelPlacement="outside"
                    placeholder="Ingresa una descripción"
                    size="md"
                    value={field.value || ""}
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="description"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              name="externalId"
              control={editForm.form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    errorMessage={fieldState.error?.message}
                    fullWidth
                    isInvalid={!!fieldState.error}
                    label="External ID (Opcional)"
                    labelPlacement="outside"
                    placeholder="Ingresa el External ID"
                    size="md"
                    value={field.value || ""}
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="externalId"
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
