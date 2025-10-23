import type React from "react";

import { Card, CardBody, Button, Input } from "@components/atoms";
import { SelectField } from "@components/molecules";

import type { NewMessageData, Receptor, UsuarioCorreo } from "@/types";

export interface MessageFormProps {
  messageData: NewMessageData;
  receptores: Receptor[];
  usuariosCorreo: UsuarioCorreo[];
  coloresTorreta: string[];
  onUpdate: (updates: Partial<NewMessageData>) => void;
  onCreate: () => void;
  onCancel: () => void;
  getColorValue: (colorName: string) => string;
}

export const MessageForm: React.FC<MessageFormProps> = ({
  messageData,
  receptores,
  usuariosCorreo,
  coloresTorreta,
  onUpdate,
  onCreate,
  onCancel,
  getColorValue,
}) => {
  return (
    <Card className="bg-slate-700 border-slate-600">
      <CardBody className="p-3">
        <h5 className="text-sm font-semibold text-slate-100 mb-2">
          Agregar Nuevo Mensaje
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <SelectField
            id="tipo-receptor"
            label="Tipo de Receptor"
            value={messageData.tipoReceptor}
            onChange={(e) =>
              onUpdate({
                tipoReceptor: e.target.value as "reloj" | "correo" | "torreta",
              })
            }
          >
            <option value="">Seleccionar tipo...</option>
            <option value="reloj">Reloj</option>
            <option value="torreta">Torreta</option>
            <option value="correo">Correo Electrónico</option>
            <option value="generico">Genérico</option>
          </SelectField>

          <SelectField
            id="receptor"
            label={
              messageData.tipoReceptor === "torreta" ? "Color" : "Receptor"
            }
            value={messageData.receptor}
            onChange={(e) => onUpdate({ receptor: e.target.value })}
          >
            <option value="">
              Seleccionar{" "}
              {messageData.tipoReceptor === "torreta" ? "color" : "receptor"}...
            </option>
            {messageData.tipoReceptor === "correo"
              ? usuariosCorreo.map((usuario) => (
                  <option key={usuario.id} value={usuario.nombre}>
                    {usuario.nombre} - {usuario.email}
                  </option>
                ))
              : messageData.tipoReceptor === "torreta"
                ? coloresTorreta.map((color) => (
                    <option
                      key={color}
                      style={{ backgroundColor: getColorValue(color) }}
                      value={color}
                    >
                      {color}
                    </option>
                  ))
                : receptores.map((receptor) => (
                    <option key={receptor.id} value={receptor.nombre}>
                      {receptor.nombre} - {receptor.departamento}
                    </option>
                  ))}
          </SelectField>

          {messageData.tipoReceptor === "torreta" && (
            <SelectField
              id="receptor-nombre-new"
              label="Receptor"
              value={messageData.receptorNombre ?? ""}
              onChange={(e) => onUpdate({ receptorNombre: e.target.value })}
            >
              <option value="">Seleccionar receptor...</option>
              {receptores.map((receptor) => (
                <option key={receptor.id} value={receptor.nombre}>
                  {receptor.nombre} - {receptor.departamento}
                </option>
              ))}
            </SelectField>
          )}

          {(messageData.tipoReceptor === "reloj" ||
            messageData.tipoReceptor === "correo") && (
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-slate-300"
                htmlFor="mensaje"
              >
                Mensaje
              </label>
              <Input
                id="mensaje"
                placeholder="Ej: Mensaje de alerta"
                size="sm"
                value={messageData.message}
                variant="bordered"
                onChange={(e) => onUpdate({ message: e.target.value })}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-600">
          <Button
            color="default"
            size="sm"
            variant="bordered"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            color="success"
            isDisabled={!messageData.tipoReceptor || !messageData.receptor}
            size="sm"
            variant="solid"
            onClick={onCreate}
          >
            Crear Mensaje
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
