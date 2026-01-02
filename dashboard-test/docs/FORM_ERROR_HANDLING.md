# Guía de Manejo de Errores en Formularios

Esta guía explica cómo usar el sistema robusto de manejo de errores implementado en los modales del sistema, que utiliza `react-hook-form`, `Zod` para validación, y un sistema unificado de manejo de errores del backend.

## Tabla de Contenidos

- [Introducción](#introducción)
- [Componentes Principales](#componentes-principales)
- [Uso Básico](#uso-básico)
- [Patrones Avanzados](#patrones-avanzados)
- [Mejores Prácticas](#mejores-prácticas)
- [Ejemplos](#ejemplos)

## Introducción

El sistema de manejo de errores está diseñado para:

- ✅ Validación frontend con Zod (espejando las reglas del backend)
- ✅ Manejo automático de errores del backend (4xx y 5xx)
- ✅ Mensajes de error claros y específicos por campo
- ✅ Toast notifications para feedback inmediato
- ✅ Validación en tiempo real (onBlur por defecto)
- ✅ Accesibilidad (ARIA labels, roles, etc.)

## Componentes Principales

### 1. `useFormValidation` Hook

Hook unificado que combina `react-hook-form`, `Zod`, y `useModalError`.

```typescript
import { useFormValidation } from "@/hooks/useFormValidation";
import { createDeviceSchema } from "@/lib/validations/schemas";

const { form, modalError, handleBackendError, resetForm, toast } =
  useFormValidation({
    schema: createDeviceSchema,
    defaultValues: {
      name: "",
      areaId: undefined,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Dispositivo creado exitosamente",
  });
```

### 2. Componentes de Error

#### `FieldError`

Muestra errores de validación por campo específico.

```tsx
<FieldError error={fieldState.error?.message} fieldId="name" />
```

#### `ValidationErrorList`

Muestra una lista de errores de validación generales.

```tsx
{modalError.validationErrors.length > 0 && (
  <ValidationErrorList errors={modalError.validationErrors} />
)}
```

#### `ErrorMessage`

Muestra errores del servidor (4xx/5xx).

```tsx
{modalError.serverError && (
  <ErrorMessage
    message={modalError.serverError}
    type="server"
    isServerError={modalError.parsedError?.isServerError ?? false}
  />
)}
```

## Uso Básico

### 1. Definir el Schema de Validación

Primero, define el schema Zod en `src/lib/validations/schemas.ts`:

```typescript
import { z } from "zod";

export const createDeviceSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  areaId: z.number().positive("El ID del área debe ser un número positivo"),
  externalId: z.string().min(1, "El External ID no puede estar vacío"),
  isVirtualDevice: z.boolean().optional(),
});
```

### 2. Crear el Formulario

```tsx
import { Controller } from "react-hook-form";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createDeviceSchema } from "@/lib/validations/schemas";
import { Input } from "@components/atoms";
import { FieldError } from "@components/molecules";

export const CreateDeviceForm = () => {
  const { form, modalError, handleBackendError, clearAllErrors } =
    useFormValidation({
      schema: createDeviceSchema,
      defaultValues: {
        name: "",
        areaId: undefined,
      },
      showToastOnError: true,
    });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      clearAllErrors();
      await deviceService.create(data);
      // Éxito manejado automáticamente si showToastOnSuccess es true
    } catch (error) {
      handleBackendError(error);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Errores de validación generales */}
      {modalError.validationErrors.length > 0 && (
        <ValidationErrorList errors={modalError.validationErrors} />
      )}

      {/* Error del servidor */}
      {modalError.serverError && (
        <ErrorMessage
          message={modalError.serverError}
          type="server"
          isServerError={modalError.parsedError?.isServerError ?? false}
        />
      )}

      {/* Campo del formulario */}
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <>
            <Input
              {...field}
              label="Nombre"
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
            <FieldError error={fieldState.error?.message} fieldId="name" />
          </>
        )}
      />

      <button type="submit">Crear</button>
    </form>
  );
};
```

## Patrones Avanzados

### Resetear el Formulario

Para modales que se abren/cierran, usa `resetForm` directamente en los handlers:

```tsx
const handleCreate = () => {
  createForm.resetForm({
    name: "",
    areaId: undefined,
  });
  setIsCreateModalOpen(true);
};

const handleCancel = () => {
  createForm.resetForm();
  setIsCreateModalOpen(false);
};
```

**Importante:** NO uses `useEffect` con `form` o `resetForm` en las dependencias, ya que esto causa re-renders infinitos y borra los caracteres mientras el usuario escribe.

### Para Modales con `isOpen` como Prop

Usa `useRef` para rastrear cuando el modal se abre:

```tsx
const prevIsOpenRef = useRef(isOpen);

useEffect(() => {
  if (isOpen && !prevIsOpenRef.current && device) {
    resetForm({
      name: device.name,
      externalId: device.externalId,
    });
  }
  prevIsOpenRef.current = isOpen;
}, [isOpen, device, resetForm]);
```

### Validación Condicional

Puedes usar `z.refine()` para validación condicional:

```typescript
export const createUserSchema = z
  .object({
    username: z.string().min(3),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
```

## Mejores Prácticas

### 1. Espejar Reglas del Backend

Los schemas Zod deben reflejar exactamente las reglas de `class-validator` del backend:

```typescript
// Backend: @IsString() @MinLength(3)
// Frontend:
z.string().min(3, "Debe tener al menos 3 caracteres")
```

### 2. Mensajes de Error User-Friendly

Usa mensajes en español que sean claros para el usuario:

```typescript
// ❌ Malo
z.string().min(1, "name is required")

// ✅ Bueno
z.string().min(1, "El nombre es requerido")
```

### 3. Limpiar Errores Antes de Enviar

Siempre limpia los errores antes de enviar el formulario:

```typescript
const handleSubmit = form.handleSubmit(async (data) => {
  try {
    clearAllErrors(); // Limpiar errores previos
    await submitData(data);
  } catch (error) {
    handleBackendError(error); // Manejar nuevos errores
  }
});
```

### 4. Usar `Controller` para Campos Personalizados

Para componentes que no son de HeroUI o componentes personalizados:

```tsx
<Controller
  name="customField"
  control={form.control}
  render={({ field, fieldState }) => (
    <CustomComponent
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  )}
/>
```

### 5. Separar Modales de Crear y Editar

Para evitar problemas con estados compartidos, usa modales separados:

```tsx
{/* Modal de Crear */}
<Modal isOpen={isCreateModalOpen} onClose={handleCancel}>
  <form onSubmit={handleCreateSubmit}>...</form>
</Modal>

{/* Modal de Editar */}
<Modal isOpen={isEditModalOpen} onClose={handleCancel}>
  <form onSubmit={handleEditSubmit}>...</form>
</Modal>
```

## Ejemplos

### Ejemplo Completo: Modal de Crear Área

```tsx
import { Controller } from "react-hook-form";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createAreaSchema } from "@/lib/validations/schemas";
import { Input, Button, ValidationErrorList, ErrorMessage } from "@components/atoms";
import { FieldError } from "@components/molecules";

export function AreasCatalog() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const createForm = useFormValidation({
    schema: createAreaSchema,
    defaultValues: { name: "" },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Área creada exitosamente",
  });

  const handleCreate = () => {
    createForm.resetForm({ name: "" });
    setIsCreateModalOpen(true);
  };

  const handleCancel = () => {
    createForm.resetForm();
    setIsCreateModalOpen(false);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createAreaMutation.mutateAsync(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  return (
    <>
      <Button onClick={handleCreate}>Crear Área</Button>

      <Modal isOpen={isCreateModalOpen} onClose={handleCancel}>
        <form onSubmit={handleCreateSubmit}>
          {createForm.modalError.validationErrors.length > 0 && (
            <ValidationErrorList errors={createForm.modalError.validationErrors} />
          )}

          {createForm.modalError.serverError && (
            <ErrorMessage
              message={createForm.modalError.serverError}
              type="server"
              isServerError={createForm.modalError.parsedError?.isServerError ?? false}
            />
          )}

          <Controller
            name="name"
            control={createForm.form.control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  label="Nombre"
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
                <FieldError error={fieldState.error?.message} fieldId="name" />
              </>
            )}
          />

          <Button type="submit">Crear</Button>
          <Button type="button" onPress={handleCancel}>Cancelar</Button>
        </form>
      </Modal>
    </>
  );
}
```

## Recursos Adicionales

- [Documentación de react-hook-form](https://react-hook-form.com/)
- [Documentación de Zod](https://zod.dev/)
- [HeroUI Components](https://heroui.com/)

## Troubleshooting

### Los caracteres desaparecen mientras escribo

**Problema:** Usar `useEffect` con `form` o `resetForm` en las dependencias.

**Solución:** Llama `resetForm` directamente en los handlers, no en `useEffect`.

### Los errores del backend no se muestran

**Problema:** No estás llamando `handleBackendError` en el catch.

**Solución:** Siempre llama `handleBackendError(error)` en el bloque catch.

### El formulario no valida

**Problema:** El schema Zod no está correctamente configurado.

**Solución:** Verifica que el schema tenga reglas de validación (`.min()`, `.email()`, etc.).

