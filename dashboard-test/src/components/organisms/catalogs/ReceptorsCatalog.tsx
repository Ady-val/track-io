import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useReceptors,
  useCreateReceptor,
  useUpdateReceptor,
  useDeleteReceptor,
  type Receptor,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  createReceptorSchema,
  updateReceptorSchema,
} from "@/lib/validations/schemas";

import { ErrorMessage, ValidationErrorList, Button, Input } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
import { Modal } from "../Modal";

export function ReceptorsCatalog() {
  const hasCreate = useHasPermission(Module.CATALOGS, Action.CREATE);
  const hasUpdate = useHasPermission(Module.CATALOGS, Action.UPDATE);
  const hasDelete = useHasPermission(Module.CATALOGS, Action.DELETE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReceptor, setSelectedReceptor] = useState<Receptor | null>(
    null
  );

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

  // Form para crear
  const createForm = useFormValidation({
    schema: createReceptorSchema,
    defaultValues: {
      externalId: "",
      name: "",
      isActive: undefined,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Receptor creado exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateReceptorSchema,
    defaultValues: {
      externalId: selectedReceptor?.externalId ?? "",
      name: selectedReceptor?.name ?? "",
      isActive: selectedReceptor?.isActive,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Receptor actualizado exitosamente",
  });

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
    createForm.resetForm({
      externalId: "",
      name: "",
      isActive: undefined,
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (receptor: Receptor) => {
    setSelectedReceptor(receptor);
    editForm.resetForm({
      externalId: receptor.externalId,
      name: receptor.name,
      isActive: receptor.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (receptor: Receptor) => {
    setSelectedReceptor(receptor);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createReceptorMutation.mutateAsync(data);
      createForm.toast.success("Receptor creado exitosamente");
      createForm.resetForm({
        externalId: "",
        name: "",
        isActive: undefined,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selectedReceptor) return;

    try {
      editForm.clearAllErrors();
      const updateData = {
        externalId: data.externalId ?? selectedReceptor.externalId,
        name: data.name ?? selectedReceptor.name,
        isActive: data.isActive ?? selectedReceptor.isActive,
      };

      await updateReceptorMutation.mutateAsync({
        id: selectedReceptor.id,
        data: updateData,
      });
      editForm.toast.success("Receptor actualizado exitosamente");
      editForm.resetForm(updateData);
      setIsEditModalOpen(false);
      setSelectedReceptor(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (selectedReceptor) {
      try {
        await deleteReceptorMutation.mutateAsync(selectedReceptor.id);
        setIsDeleteModalOpen(false);
        setSelectedReceptor(null);
      } catch {
        // El error se maneja automáticamente por la mutación
      }
    }
  };

  const handleCancel = () => {
    createForm.resetForm({
      externalId: "",
      name: "",
      isActive: undefined,
    });
    if (selectedReceptor) {
      editForm.resetForm({
        externalId: selectedReceptor.externalId,
        name: selectedReceptor.name,
        isActive: selectedReceptor.isActive,
      });
    }
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedReceptor(null);
  };

  const isCreateLoading = createReceptorMutation.isPending;
  const isEditLoading = updateReceptorMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar receptores..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-receptor-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Receptor
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={filteredReceptors}
          data-cy="receptors-table"
          emptyMessage="No hay receptores registrados"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
        />
      </div>

      {/* Modal de Crear */}
      <Modal
        data-cy="create-receptor-modal"
        isOpen={isCreateModalOpen}
        title="Crear Receptor"
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
              name="externalId"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="ID Externo"
                    labelPlacement="outside"
                    placeholder="Ingresa el ID externo"
                    size="md"
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

          <div>
            <Controller
              control={createForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre del receptor"
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
        data-cy="edit-receptor-modal"
        isOpen={isEditModalOpen}
        title="Editar Receptor"
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
              name="externalId"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="ID Externo"
                    labelPlacement="outside"
                    placeholder="Ingresa el ID externo"
                    size="md"
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

          <div>
            <Controller
              control={editForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre del receptor"
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
        data-cy="delete-receptor-confirmation-modal"
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
