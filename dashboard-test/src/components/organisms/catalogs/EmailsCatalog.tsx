import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useEmails,
  useCreateEmail,
  useUpdateEmail,
  useDeleteEmail,
  type Email,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  createEmailSchema,
  updateEmailSchema,
} from "@/lib/validations/schemas";

import { Button, ErrorMessage, Input, ValidationErrorList } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";

export function EmailsCatalog() {
  const hasCreate = useHasPermission(Module.CATALOGS, Action.CREATE);
  const hasUpdate = useHasPermission(Module.CATALOGS, Action.UPDATE);
  const hasDelete = useHasPermission(Module.CATALOGS, Action.DELETE);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  const { data: emailsData, isLoading } = useEmails({
    limit: itemsPerPage,
    offset,
    name: searchTerm || undefined,
    email: searchTerm || undefined,
  });

  const createEmailMutation = useCreateEmail();
  const updateEmailMutation = useUpdateEmail();
  const deleteEmailMutation = useDeleteEmail();

  const emails = emailsData?.data ?? [];
  const totalItems = emailsData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Form para crear
  const createForm = useFormValidation({
    schema: createEmailSchema,
    defaultValues: {
      name: "",
      email: "",
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Correo creado exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateEmailSchema,
    defaultValues: {
      name: selectedEmail?.name ?? "",
      email: selectedEmail?.email ?? "",
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Correo actualizado exitosamente",
  });

  const columns: Array<TableColumn<Email>> = [
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
      width: "200px",
    },
    {
      id: "email",
      label: "Correo Electrónico",
      key: "email",
      width: "100%",
    },
  ];

  const handleCreate = () => {
    createForm.resetForm({ name: "", email: "" });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (email: Email) => {
    setSelectedEmail(email);
    editForm.resetForm({ name: email.name, email: email.email });
    setIsEditModalOpen(true);
  };

  const handleDelete = (email: Email) => {
    setSelectedEmail(email);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createEmailMutation.mutateAsync(data);
      createForm.toast.success("Correo creado exitosamente");
      createForm.resetForm({ name: "", email: "" });
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selectedEmail) return;

    try {
      editForm.clearAllErrors();
      const updateData = {
        name: data.name ?? selectedEmail.name,
        email: data.email ?? selectedEmail.email,
      };

      await updateEmailMutation.mutateAsync({
        id: selectedEmail.id,
        data: updateData,
      });
      editForm.toast.success("Correo actualizado exitosamente");
      editForm.resetForm(updateData);
      setIsEditModalOpen(false);
      setSelectedEmail(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (selectedEmail) {
      try {
        await deleteEmailMutation.mutateAsync(selectedEmail.id);
        setIsDeleteModalOpen(false);
        setSelectedEmail(null);
      } catch {
        // El error se maneja automáticamente por la mutación
      }
    }
  };

  const handleCancel = () => {
    createForm.resetForm({ name: "", email: "" });
    if (selectedEmail?.name) {
      editForm.resetForm({
        name: selectedEmail.name,
        email: selectedEmail.email,
      });
    }
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedEmail(null);
  };

  const isCreateLoading = createEmailMutation.isPending;
  const isEditLoading = updateEmailMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar correos..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-email-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Correo
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={emails}
          data-cy="emails-table"
          emptyMessage="No hay correos registrados"
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
        data-cy="create-email-modal"
        isOpen={isCreateModalOpen}
        title="Crear Correo"
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
                    placeholder="Ingresa el nombre"
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
              name="email"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Correo Electrónico"
                    labelPlacement="outside"
                    placeholder="ejemplo@correo.com"
                    size="md"
                    type="email"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="email"
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
        data-cy="edit-email-modal"
        isOpen={isEditModalOpen}
        title="Editar Correo"
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
                    placeholder="Ingresa el nombre"
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
              name="email"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Correo Electrónico"
                    labelPlacement="outside"
                    placeholder="ejemplo@correo.com"
                    size="md"
                    type="email"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="email"
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
        data-cy="delete-email-confirmation-modal"
        isOpen={isDeleteModalOpen}
        loading={deleteEmailMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedEmail?.name}" (${selectedEmail?.email})?`}
        title="Eliminar Correo"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
