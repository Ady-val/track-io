import React, { useState } from "react";

import {
  useEmails,
  useCreateEmail,
  useUpdateEmail,
  useDeleteEmail,
  type Email,
} from "@/hooks/useCatalogs";

import { useModalError } from "@/hooks/useModalError";

import { Button } from "../../atoms/Button";
import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";

export function EmailsCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");

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
    setFormData({ name: "", email: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (email: Email) => {
    setSelectedEmail(email);
    setFormData({ name: email.name, email: email.email });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleDelete = (email: Email) => {
    setSelectedEmail(email);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string; email?: string } = {};

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      errors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "El correo electrónico no es válido";
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
        await createEmailMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedEmail) {
        await updateEmailMutation.mutateAsync({
          id: selectedEmail.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ name: "", email: "" });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar el correo");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedEmail) {
      try {
        await deleteEmailMutation.mutateAsync(selectedEmail.id);
        setIsDeleteModalOpen(false);
        setSelectedEmail(null);
      } catch (error) {
        console.error("Error deleting email:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedEmail(null);
  };

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
        <Button
          className="ml-4"
          color="primary"
          size="lg"
          onClick={handleCreate}
        >
          Crear Correo
        </Button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={emails}
          emptyMessage="No hay correos registrados"
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
        title={isCreateModalOpen ? "Crear Correo" : "Editar Correo"}
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
            placeholder="Ingresa el nombre"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <FormField
            required
            error={formErrors.email}
            label="Correo Electrónico"
            name="email"
            placeholder="ejemplo@correo.com"
            type="email"
            value={formData.email}
            onChange={(value) =>
              setFormData({ ...formData, email: value as string })
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={
                createEmailMutation.isPending || updateEmailMutation.isPending
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
                createEmailMutation.isPending || updateEmailMutation.isPending
              }
              size="md"
              type="submit"
              variant="solid"
            >
              {createEmailMutation.isPending || updateEmailMutation.isPending
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

