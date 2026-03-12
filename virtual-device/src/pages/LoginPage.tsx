import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "@/contexts/AuthContext";
import AuthService from "@/lib/services/auth.service";

const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      login(data.access_token, data.user);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error).message ||
        "Error al iniciar sesión. Por favor, verifica tus credenciales.";

      if (
        (error as { response?: { status?: number } })?.response?.status === 401
      ) {
        setError("root", {
          type: "manual",
          message:
            "Credenciales inválidas. Por favor, verifica tu usuario y contraseña.",
        });
      } else {
        setError("root", {
          type: "manual",
          message: errorMessage,
        });
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-slate-800 p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">Track.IO</h1>
            <p className="mt-2 text-slate-400">Iniciar Sesión</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                {errors.root.message}
              </div>
            )}

            <div>
              <Input
                {...register("username")}
                autoFocus
                autoComplete="username"
                classNames={{
                  input: "text-white",
                  label: "text-slate-300",
                  inputWrapper: "border-slate-600",
                }}
                data-cy="username-input"
                errorMessage={errors.username?.message}
                isInvalid={!!errors.username}
                label="Nombre de Usuario"
                placeholder="Ingresa tu nombre de usuario"
                variant="bordered"
              />
            </div>

            <div>
              <Input
                {...register("password")}
                autoComplete="current-password"
                classNames={{
                  input: "text-white",
                  label: "text-slate-300",
                  inputWrapper: "border-slate-600",
                }}
                data-cy="password-input"
                errorMessage={errors.password?.message}
                isInvalid={!!errors.password}
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                type="password"
                variant="bordered"
              />
            </div>

            <Button
              className="w-full"
              color="primary"
              data-cy="login-submit-button"
              disabled={loginMutation.isPending}
              isLoading={loginMutation.isPending}
              type="submit"
            >
              {loginMutation.isPending
                ? "Iniciando sesión..."
                : "Iniciar Sesión"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
