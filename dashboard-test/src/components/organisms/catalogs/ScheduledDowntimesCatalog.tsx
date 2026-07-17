import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useScheduledDowntimes,
  useCreateScheduledDowntime,
  useUpdateScheduledDowntime,
  useDeleteScheduledDowntime,
  useAreas,
  type ScheduledDowntime,
  type Area,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  createScheduledDowntimeSchema,
  updateScheduledDowntimeSchema,
} from "@/lib/validations/schemas";
import { DAYS_OF_WEEK_LABELS } from "@/types/scheduled-downtime";

import {
  ErrorMessage,
  ValidationErrorList,
  Button,
  Input,
  Select,
  Checkbox,
  Text,
} from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
import { Modal } from "../Modal";

// Lunes a domingo, orden de calendario laboral. Value = Date.getDay() (0=domingo).
const DAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: DAYS_OF_WEEK_LABELS[1]! },
  { value: 2, label: DAYS_OF_WEEK_LABELS[2]! },
  { value: 3, label: DAYS_OF_WEEK_LABELS[3]! },
  { value: 4, label: DAYS_OF_WEEK_LABELS[4]! },
  { value: 5, label: DAYS_OF_WEEK_LABELS[5]! },
  { value: 6, label: DAYS_OF_WEEK_LABELS[6]! },
  { value: 0, label: DAYS_OF_WEEK_LABELS[0]! },
];

/**
 * Una ventana cruza medianoche cuando su hora de fin es menor que la de inicio
 * (ej. 23:00 -> 02:00): cierra al día siguiente. Ver PLAN §1.4b.
 */
function crossesMidnight(startTime: string, endTime: string): boolean {
  return Boolean(startTime) && Boolean(endTime) && endTime < startTime;
}

/** Formatea el horario mostrando explícitamente el cruce de medianoche. */
function formatSchedule(startTime: string, endTime: string): string {
  return crossesMidnight(startTime, endTime)
    ? `${startTime} - ${endTime} (+1 día)`
    : `${startTime} - ${endTime}`;
}

/**
 * Aviso contextual bajo los campos de hora: aclara que son horas de planta y
 * confirma visualmente cuando la ventana cruza medianoche, para que capturar
 * "23:00 a 02:00" no parezca un error del usuario.
 */
function ScheduleHint({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string;
}) {
  return (
    <Text className="mt-1" color="secondary" variant="small">
      {crossesMidnight(startTime, endTime)
        ? "Hora de planta · Esta ventana cruza medianoche: cierra al día siguiente."
        : "Hora de planta (no la del navegador)."}
    </Text>
  );
}

/** Selector de días de la semana, independiente del tipo de formulario (create/edit). */
function DaysOfWeekPicker({
  value,
  onChange,
  disabled,
}: {
  value: number[];
  onChange: (next: number[]) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {DAY_OPTIONS.map((day) => (
        <Checkbox
          key={day.value}
          isDisabled={disabled}
          isSelected={value.includes(day.value)}
          onValueChange={(isSelected) => {
            onChange(
              isSelected
                ? [...value, day.value]
                : value.filter((d) => d !== day.value)
            );
          }}
        >
          {day.label}
        </Checkbox>
      ))}
    </div>
  );
}

export function ScheduledDowntimesCatalog() {
  const hasCreate = useHasPermission(Module.SCHEDULED_DOWNTIMES, Action.CREATE);
  const hasUpdate = useHasPermission(Module.SCHEDULED_DOWNTIMES, Action.UPDATE);
  const hasDelete = useHasPermission(Module.SCHEDULED_DOWNTIMES, Action.DELETE);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selected, setSelected] = useState<ScheduledDowntime | null>(null);

  const { data: scheduledDowntimesData, isLoading } = useScheduledDowntimes();
  const { data: areasData } = useAreas();
  const areas = areasData?.data ?? [];

  const createMutation = useCreateScheduledDowntime();
  const updateMutation = useUpdateScheduledDowntime();
  const deleteMutation = useDeleteScheduledDowntime();

  const scheduledDowntimes = scheduledDowntimesData?.data ?? [];
  const filtered = scheduledDowntimes.filter(
    (item: ScheduledDowntime) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.area?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emptyFormValues = {
    name: "",
    areaId: areas[0]?.id ?? 0,
    startTime: "",
    endTime: "",
    daysOfWeek: [] as number[],
    isActive: true,
  };

  // Form para crear
  const createForm = useFormValidation({
    schema: createScheduledDowntimeSchema,
    defaultValues: emptyFormValues,
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Paro programado creado exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateScheduledDowntimeSchema,
    defaultValues: {
      name: selected?.name ?? "",
      areaId: selected?.areaId ?? 0,
      startTime: selected?.startTime ?? "",
      endTime: selected?.endTime ?? "",
      daysOfWeek: selected?.daysOfWeek ?? [],
      isActive: selected?.isActive ?? true,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Paro programado actualizado exitosamente",
  });

  const columns: Array<TableColumn<ScheduledDowntime>> = [
    { id: "id", label: "ID", key: "id", width: "70px" },
    { id: "name", label: "Nombre", key: "name" },
    {
      id: "area",
      label: "Área",
      key: "area",
      component: (value) => (value as ScheduledDowntime["area"])?.name ?? "—",
    },
    {
      id: "schedule",
      label: "Horario",
      key: "startTime",
      component: (_value, row) => formatSchedule(row.startTime, row.endTime),
    },
    {
      id: "daysOfWeek",
      label: "Días",
      key: "daysOfWeek",
      component: (value) =>
        (value as number[])
          .slice()
          .sort((a, b) => a - b)
          .map((day) => DAYS_OF_WEEK_LABELS[day])
          .join(", "),
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
    createForm.resetForm(emptyFormValues);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: ScheduledDowntime) => {
    setSelected(item);
    editForm.resetForm({
      name: item.name,
      areaId: item.areaId,
      startTime: item.startTime,
      endTime: item.endTime,
      daysOfWeek: item.daysOfWeek,
      isActive: item.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: ScheduledDowntime) => {
    setSelected(item);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createMutation.mutateAsync(data);
      createForm.toast.success("Paro programado creado exitosamente");
      createForm.resetForm(emptyFormValues);
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selected) return;

    try {
      editForm.clearAllErrors();
      await updateMutation.mutateAsync({ id: selected.id, data });
      editForm.toast.success("Paro programado actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelected(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (!selected) return;

    try {
      await deleteMutation.mutateAsync(selected.id);
      setIsDeleteModalOpen(false);
      setSelected(null);
    } catch {
      // El error se maneja automáticamente por la mutación
    }
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelected(null);
  };

  const isCreateLoading = createMutation.isPending;
  const isEditLoading = updateMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar paros programados..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-scheduled-downtime-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Paro Programado
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={filtered}
          data-cy="scheduled-downtimes-table"
          emptyMessage="No hay paros programados registrados"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
        />
      </div>

      {/* Modal de Crear */}
      <Modal
        data-cy="create-scheduled-downtime-modal"
        isOpen={isCreateModalOpen}
        title="Crear Paro Programado"
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
                    isDisabled={isCreateLoading}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ej: Comida, Cambio de turno"
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
              name="areaId"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="create-scheduled-downtime-area"
                  >
                    Área
                  </label>
                  <Select
                    fullWidth
                    disabled={isCreateLoading}
                    id="create-scheduled-downtime-area"
                    isInvalid={!!fieldState.error}
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map((area: Area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="areaId"
                  />
                </>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={createForm.form.control}
              name="startTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isCreateLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de inicio"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="startTime"
                  />
                </>
              )}
            />
            <Controller
              control={createForm.form.control}
              name="endTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isCreateLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de fin"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="endTime"
                  />
                </>
              )}
            />
          </div>
          <ScheduleHint
            endTime={createForm.form.watch("endTime") ?? ""}
            startTime={createForm.form.watch("startTime") ?? ""}
          />

          <div>
            <Text className="mb-2" color="secondary" variant="small">
              Días en que INICIA el paro programado
            </Text>
            <Controller
              control={createForm.form.control}
              name="daysOfWeek"
              render={({ field, fieldState }) => (
                <>
                  <DaysOfWeekPicker
                    disabled={isCreateLoading}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="daysOfWeek"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={createForm.form.control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  isDisabled={isCreateLoading}
                  isSelected={field.value ?? true}
                  onValueChange={field.onChange}
                >
                  Activo
                </Checkbox>
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
              disabled={isCreateLoading}
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
        data-cy="edit-scheduled-downtime-modal"
        isOpen={isEditModalOpen}
        title="Editar Paro Programado"
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
                    isDisabled={isEditLoading}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ej: Comida, Cambio de turno"
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
              name="areaId"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="edit-scheduled-downtime-area"
                  >
                    Área
                  </label>
                  <Select
                    fullWidth
                    disabled={isEditLoading}
                    id="edit-scheduled-downtime-area"
                    isInvalid={!!fieldState.error}
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map((area: Area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="areaId"
                  />
                </>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={editForm.form.control}
              name="startTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isEditLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de inicio"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="startTime"
                  />
                </>
              )}
            />
            <Controller
              control={editForm.form.control}
              name="endTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isEditLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de fin"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="endTime"
                  />
                </>
              )}
            />
          </div>
          <ScheduleHint
            endTime={editForm.form.watch("endTime") ?? ""}
            startTime={editForm.form.watch("startTime") ?? ""}
          />

          <div>
            <Text className="mb-2" color="secondary" variant="small">
              Días en que INICIA el paro programado
            </Text>
            <Controller
              control={editForm.form.control}
              name="daysOfWeek"
              render={({ field, fieldState }) => (
                <>
                  <DaysOfWeekPicker
                    disabled={isEditLoading}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="daysOfWeek"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={editForm.form.control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  isDisabled={isEditLoading}
                  isSelected={field.value ?? true}
                  onValueChange={field.onChange}
                >
                  Activo
                </Checkbox>
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
              disabled={isEditLoading}
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
        data-cy="delete-scheduled-downtime-confirmation-modal"
        isOpen={isDeleteModalOpen}
        loading={deleteMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selected?.name}"?`}
        title="Eliminar Paro Programado"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
