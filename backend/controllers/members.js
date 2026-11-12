import { z } from "zod";
import { fail } from "./validation.js";

export function createAddMember({ query, member }) {
  return async (req, res) => {
    const project = await member(req.params.id, req.userId);
    if (
      project.owner_id !== req.userId &&
      req.user.account_type !== "professor"
    )
      fail(
        403,
        "Somente o criador ou um professor integrante pode adicionar integrantes.",
      );
    const { email } = z
      .object({
        email: z
          .string()
          .trim()
          .pipe(z.email())
          .transform((v) => v.toLowerCase()),
      })
      .strict()
      .parse(req.body);
    const user = (
      await query("SELECT id,name,email FROM users WHERE email=?", [email])
    )[0];
    if (!user)
      fail(
        404,
        "Nenhuma conta encontrada com este e-mail. Compartilhe o convite para a pessoa se cadastrar e entrar no grupo.",
      );
    await query(
      "INSERT INTO project_members (project_id,user_id) VALUES (?,?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)",
      [project.id, user.id],
    );
    res.json(user);
  };
}
