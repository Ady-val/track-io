# Instrucciones Finales para Cursor

Este documento contiene las instrucciones finales que deben seguirse cuando se indique que se deben ejecutar las instrucciones finales.

## Instrucciones

### 1. Eliminar comentarios en el código

- Eliminar cualquier comentario realizado en código en todo el proyecto.

### 2. Build - backend-receptor

- Ejecutar `pnpm run build` en la carpeta `/backend-receptor`.
- Si aparecen errores, corregirlos y ejecutar nuevamente `pnpm run build`.
- Repetir este proceso hasta que no aparezcan más errores.

### 3. Build - dashboard-test

- Ejecutar `pnpm run build` en la carpeta `/dashboard-test`.
- Si aparecen errores, corregirlos y ejecutar nuevamente `pnpm run build`.
- Repetir este proceso hasta que no aparezcan más errores.

### 4. Build - virtual-device

- Ejecutar `pnpm run build` en la carpeta `/virtual-device`.
- Si aparecen errores, corregirlos y ejecutar nuevamente `pnpm run build`.
- Repetir este proceso hasta que no aparezcan más errores.

### 5. Lint - backend-receptor

- Ejecutar `pnpm run lint` en la carpeta `/backend-receptor`.
- Si aparecen errores o warnings, corregirlos y ejecutar nuevamente `pnpm run lint`.
- Repetir este proceso hasta que no aparezcan más errores ni warnings.

### 6. Lint - dashboard-test

- Ejecutar `pnpm run lint` en la carpeta `/dashboard-test`.
- Si aparecen errores o warnings, corregirlos y ejecutar nuevamente `pnpm run lint`.
- Repetir este proceso hasta que no aparezcan más errores ni warnings.

### 7. Lint - virtual-device

- Ejecutar `pnpm run lint` en la carpeta `/virtual-device`.
- Si aparecen errores o warnings, corregirlos y ejecutar nuevamente `pnpm run lint`.
- Repetir este proceso hasta que no aparezcan más errores ni warnings.

### 8. Eliminar console.log de debugging

- Eliminar cualquier `console.log` utilizado para debugging para mantener el sistema limpio.
- Buscar y eliminar todos los `console.log` en todo el proyecto.

## Nota

Estas instrucciones deben ejecutarse en el orden especificado y cada paso debe completarse exitosamente antes de continuar con el siguiente.
