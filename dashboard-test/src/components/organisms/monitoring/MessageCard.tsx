import type React from "react";
import { Card, CardBody, Chip, Input } from "@components/atoms";
import { SelectField } from "@components/molecules";
import { FaCopy, FaTrashCan } from "react-icons/fa6";
import type { Message, GrupoMensaje, Receptor, UsuarioCorreo } from "@/types";

export interface MessageCardProps {
  message: Message;
  gruposMensajes: GrupoMensaje[];
  receptores: Receptor[];
  usuariosCorreo: UsuarioCorreo[];
  coloresTorreta: string[];
  onUpdate: (messageId: number, updates: Partial<Message>) => void;
  onDuplicate: (messageId: number) => void;
  onDelete: (messageId: number) => void;
  getColorValue: (colorName: string) => string;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  gruposMensajes,
  receptores,
  usuariosCorreo,
  coloresTorreta,
  onUpdate,
  onDuplicate,
  onDelete,
  getColorValue,
}) => {
  return (
    <Card className="bg-slate-700 border-slate-600">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">
              Mensaje {message.id}
            </span>
            <Chip
              size="sm"
              style={{
                backgroundColor:
                  gruposMensajes.find((g) => g.nombre === message.grupo)
                    ?.color ?? "#6b7280",
                color: "white",
              }}
            >
              {message.grupo}
            </Chip>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-blue-400 hover:text-blue-300 text-sm"
              title="Duplicar mensaje"
              onClick={() => onDuplicate(message.id)}
            >
              <FaCopy className="w-3 h-3" />
            </button>
            <button
              className="text-red-400 hover:text-red-300 text-sm"
              title="Eliminar mensaje"
              onClick={() => onDelete(message.id)}
            >
              <FaTrashCan className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <SelectField
            id={`tipo-receptor-${message.id}`}
            label="Tipo de Receptor"
            value={message.tipoReceptor}
            onChange={(e) =>
              onUpdate(message.id, {
                tipoReceptor: e.target.value as Message["tipoReceptor"],
              })
            }
          >
            <option value="reloj">Reloj</option>
            <option value="torreta">Torreta</option>
            <option value="correo">Correo Electrónico</option>
            <option value="generico">Genérico</option>
          </SelectField>

          <SelectField
            id={`receptor-${message.id}`}
            label={message.tipoReceptor === "torreta" ? "Color" : "Receptor"}
            value={message.receptor}
            onChange={(e) => onUpdate(message.id, { receptor: e.target.value })}
          >
            {message.tipoReceptor === "correo"
              ? usuariosCorreo.map((usuario) => (
                  <option key={usuario.id} value={usuario.nombre}>
                    {usuario.nombre} - {usuario.email}
                  </option>
                ))
              : message.tipoReceptor === "torreta"
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

          {message.tipoReceptor === "torreta" && (
            <SelectField
              id={`receptor-nombre-msg-${message.id}`}
              label="Receptor"
              value={message.receptorNombre ?? ""}
              onChange={(e) =>
                onUpdate(message.id, { receptorNombre: e.target.value })
              }
            >
              <option value="">Seleccionar receptor...</option>
              {receptores.map((receptor) => (
                <option key={receptor.id} value={receptor.nombre}>
                  {receptor.nombre} - {receptor.departamento}
                </option>
              ))}
            </SelectField>
          )}

          {(message.tipoReceptor === "reloj" ||
            message.tipoReceptor === "correo") && (
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-slate-300"
                htmlFor={`mensaje-msg-${message.id}`}
              >
                Texto del Mensaje
              </label>
              <Input
                id={`mensaje-msg-${message.id}`}
                placeholder="Ingresa el mensaje..."
                size="sm"
                value={message.message ?? ""}
                variant="bordered"
                onChange={(e) =>
                  onUpdate(message.id, { message: e.target.value })
                }
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
