import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useTorretaColors,
  useCreateTorretaColor,
  useUpdateTorretaColor,
  useDeleteTorretaColor,
  type TorretaColor,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  createTorretaColorSchema,
  updateTorretaColorSchema,
} from "@/lib/validations/schemas";

import { ErrorMessage, ValidationErrorList, Button, Input } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
import { Modal } from "../Modal";

export function TorretaColorsCatalog() {
  const hasCreate = useHasPermission(Module.CATALOGS, Action.CREATE);
  const hasUpdate = useHasPermission(Module.CATALOGS, Action.UPDATE);
  const hasDelete = useHasPermission(Module.CATALOGS, Action.DELETE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<TorretaColor | null>(null);

  const { data: colorsData, isLoading } = useTorretaColors();

  const createColorMutation = useCreateTorretaColor();
  const updateColorMutation = useUpdateTorretaColor();
  const deleteColorMutation = useDeleteTorretaColor();

  const colors = colorsData?.data ?? [];
  const filteredColors = colors.filter((color: { name: string }) =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form para crear
  const createForm = useFormValidation({
    schema: createTorretaColorSchema,
    defaultValues: {
      name: "",
      htmlColor: "#000000",
      deviceColorId: "",
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Color creado exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateTorretaColorSchema,
    defaultValues: {
      name: selectedColor?.name ?? "",
      htmlColor: selectedColor?.htmlColor ?? "#000000",
      deviceColorId: selectedColor?.deviceColorId ?? "",
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Color actualizado exitosamente",
  });

  const columns: Array<TableColumn<TorretaColor>> = [
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
      id: "htmlColor",
      label: "Color",
      key: "htmlColor",
      component: (value) => (
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded border border-gray-300 mr-2"
            style={{ backgroundColor: value as string }}
          />
          <span className="font-mono text-sm">{value as string}</span>
        </div>
      ),
    },
    {
      id: "deviceColorId",
      label: "ID del Dispositivo",
      key: "deviceColorId",
    },
  ];

  const handleCreate = () => {
    createForm.resetForm({
      name: "",
      htmlColor: "#000000",
      deviceColorId: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (color: TorretaColor) => {
    setSelectedColor(color);
    editForm.resetForm({
      name: color.name,
      htmlColor: color.htmlColor,
      deviceColorId: color.deviceColorId,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (color: TorretaColor) => {
    setSelectedColor(color);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createColorMutation.mutateAsync(data);
      createForm.toast.success("Color creado exitosamente");
      createForm.resetForm({
        name: "",
        htmlColor: "#000000",
        deviceColorId: "",
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selectedColor) return;

    try {
      editForm.clearAllErrors();
      const updateData = {
        name: data.name ?? selectedColor.name,
        htmlColor: data.htmlColor ?? selectedColor.htmlColor,
        deviceColorId: data.deviceColorId ?? selectedColor.deviceColorId,
      };

      await updateColorMutation.mutateAsync({
        id: selectedColor.id,
        data: updateData,
      });
      editForm.toast.success("Color actualizado exitosamente");
      editForm.resetForm(updateData);
      setIsEditModalOpen(false);
      setSelectedColor(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (selectedColor) {
      try {
        await deleteColorMutation.mutateAsync(selectedColor.id);
        setIsDeleteModalOpen(false);
        setSelectedColor(null);
      } catch {
        // El error se maneja automáticamente por la mutación
      }
    }
  };

  const handleCancel = () => {
    createForm.resetForm({
      name: "",
      htmlColor: "#000000",
      deviceColorId: "",
    });
    if (selectedColor) {
      editForm.resetForm({
        name: selectedColor.name,
        htmlColor: selectedColor.htmlColor,
        deviceColorId: selectedColor.deviceColorId,
      });
    }
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedColor(null);
  };

  const isCreateLoading = createColorMutation.isPending;
  const isEditLoading = updateColorMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar colores..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-torreta-color-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Color
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={filteredColors}
          data-cy="torreta-colors-table"
          emptyMessage="No hay colores registrados"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
        />
      </div>

      {/* Modal de Crear */}
      <Modal
        data-cy="create-torreta-color-modal"
        isOpen={isCreateModalOpen}
        title="Crear Color de Torreta"
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
                    placeholder="Ingresa el nombre del color"
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
              control={createForm.form.control}
              name="htmlColor"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="color-input-create"
                  >
                    Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      className="w-12 h-10 border border-slate-600 rounded cursor-pointer bg-slate-800"
                      id="color-input-create"
                      type="color"
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    <Input
                      {...field}
                      fullWidth
                      errorMessage={fieldState.error?.message}
                      isInvalid={!!fieldState.error}
                      placeholder="#000000"
                      size="md"
                      type="text"
                      value={field.value || ""}
                      variant="bordered"
                    />
                  </div>
                  {field.value && (
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-slate-600"
                        style={{ backgroundColor: field.value }}
                      />
                      <span className="text-sm text-slate-400">
                        Vista previa del color
                      </span>
                    </div>
                  )}
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="htmlColor"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={createForm.form.control}
              name="deviceColorId"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="ID del Dispositivo"
                    labelPlacement="outside"
                    placeholder="Ingresa el ID del dispositivo"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="deviceColorId"
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
        data-cy="edit-torreta-color-modal"
        isOpen={isEditModalOpen}
        title="Editar Color de Torreta"
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
                    placeholder="Ingresa el nombre del color"
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
              control={editForm.form.control}
              name="htmlColor"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="color-input-edit"
                  >
                    Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      className="w-12 h-10 border border-slate-600 rounded cursor-pointer bg-slate-800"
                      id="color-input-edit"
                      type="color"
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    <Input
                      {...field}
                      fullWidth
                      errorMessage={fieldState.error?.message}
                      isInvalid={!!fieldState.error}
                      placeholder="#000000"
                      size="md"
                      type="text"
                      value={field.value || ""}
                      variant="bordered"
                    />
                  </div>
                  {field.value && (
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-slate-600"
                        style={{ backgroundColor: field.value }}
                      />
                      <span className="text-sm text-slate-400">
                        Vista previa del color
                      </span>
                    </div>
                  )}
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="htmlColor"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={editForm.form.control}
              name="deviceColorId"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="ID del Dispositivo"
                    labelPlacement="outside"
                    placeholder="Ingresa el ID del dispositivo"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="deviceColorId"
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
        data-cy="delete-torreta-color-confirmation-modal"
        isOpen={isDeleteModalOpen}
        loading={deleteColorMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedColor?.name}"?`}
        title="Eliminar Color"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
