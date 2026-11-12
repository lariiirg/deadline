import { z } from "zod";
export const text = (max) =>
  z.string().trim().min(1, "Campo obrigatório.").max(max);
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD.")
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return !isNaN(d) && d.toISOString().slice(0, 10) === v;
  }, "Data inválida.");
export const projectSchema = z
  .object({
    name: text(150),
    subject: text(100),
    topic: z.string().trim().max(200).default(""),
    description: z.string().trim().max(10000).default(""),
    due_date: date,
    status: z
      .enum(["pendente", "em andamento", "concluído"])
      .default("pendente"),
  })
  .strict();
export const taskSchema = z
  .object({
    title: text(150),
    description: z.string().trim().max(10000).default(""),
    assignee_id: z.number().int().positive().nullable().default(null),
    due_date: date,
    status: z
      .enum(["pendente", "em andamento", "concluída"])
      .default("pendente"),
  })
  .strict();
export const profileSchema = z
  .object({
    name: text(120),
    email: z
      .email()
      .max(190)
      .transform((v) => v.toLowerCase()),
  })
  .strict();
export const registerSchema = profileSchema.extend({
  password: z
    .string()
    .min(8)
    .max(72)
    .refine((v) => Buffer.byteLength(v) <= 72, "Senha deve ter até 72 bytes."),
  account_type: z.enum(["aluno", "professor"]).default("aluno"),
});
export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
export function id(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(400, "Identificador inválido.");
  return n;
}
