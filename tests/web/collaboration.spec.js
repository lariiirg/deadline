const { test, expect } = require("@playwright/test");

test("real collaboration: invite, login, two sessions, task, progress, access control and logout", async ({
  browser,
  baseURL,
}) => {
  test.skip(
    process.env.RUN_DB_BROWSER !== "1",
    "Requires a real API and MySQL.",
  );
  const api = process.env.TEST_API_URL || "http://127.0.0.1:3000/api";
  const { pool } = await import("../../backend/config/db.js");
  const stamp = Date.now();
  const accounts = [];
  const contexts = [];
  let project;
  const call = async (path, token, method = "GET", body) => {
    const response = await fetch(api + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      body: response.status === 204 ? null : await response.json(),
    };
  };
  try {
    for (const label of ["owner", "member"]) {
      const result = await call("/auth/register", null, "POST", {
        name: "Equipe " + label,
        email: `e4-${stamp}-${label}@example.com`,
        password: "Integration-test-123",
        account_type: "aluno",
      });
      expect(result.status).toBe(201);
      accounts.push(result.body);
    }
    const [owner, member] = accounts;
    const result = await call("/projects", owner.token, "POST", {
      name: "Colaboração " + stamp,
      subject: "Ciências",
      description: "Teste temporário de colaboração",
      due_date: "2030-12-01",
    });
    expect(result.status).toBe(201);
    project = result.body;
    const detail = (await call("/projects/" + project.id, owner.token)).body;
    expect((await call("/projects/" + project.id, member.token)).status).toBe(
      404,
    );
    const ownerContext = await browser.newContext({ baseURL });
    contexts.push(ownerContext);
    await ownerContext.addInitScript(
      (token) => localStorage.setItem("deadline.token", token),
      owner.token,
    );
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/");
    await expect(
      ownerPage.getByText("Projetos recentes", { exact: true }),
    ).toBeVisible();
    const memberContext = await browser.newContext({ baseURL });
    contexts.push(memberContext);
    const memberPage = await memberContext.newPage();
    await memberPage.goto("/?invite=" + detail.invitation.code);
    await memberPage
      .getByLabel("E-mail", { exact: true })
      .fill(member.user.email);
    await memberPage
      .getByLabel("Senha", { exact: true })
      .fill("Integration-test-123");
    await memberPage
      .getByRole("button", { name: "Entrar", exact: true })
      .click();
    await expect(memberPage.getByLabel("Código do convite")).toHaveValue(
      detail.invitation.code,
    );
    await memberPage
      .getByRole("button", { name: "Entrar no projeto", exact: true })
      .click();
    await expect(
      memberPage.getByText("Nossa equipe · 2", { exact: true }),
    ).toBeVisible();
    await expect(
      memberPage.getByRole("button", { name: "Editar projeto", exact: true }),
    ).toHaveCount(0);
    const task = await call(
      `/projects/${project.id}/tasks`,
      owner.token,
      "POST",
      {
        title: "Atividade " + stamp,
        assignee_id: member.user.id,
        due_date: "2030-12-01",
      },
    );
    expect(task.status).toBe(201);
    const state = await memberContext.storageState();
    await memberContext.close();
    const reopened = await browser.newContext({ baseURL, storageState: state });
    contexts.push(reopened);
    const memberAgain = await reopened.newPage();
    await memberAgain.goto("/");
    await expect(
      memberAgain.getByText("Projetos recentes", { exact: true }),
    ).toBeVisible();
    await memberAgain
      .getByRole("tab", { name: "Tarefas", exact: true })
      .click();
    await expect(
      memberAgain.getByText("Atividade " + stamp, { exact: true }),
    ).toBeVisible();
    await memberAgain
      .getByRole("button", { name: "Abrir projeto", exact: true })
      .click();
    await memberAgain
      .getByRole("button", { name: "concluída", exact: true })
      .click();
    await expect(memberAgain.getByText("100%", { exact: true })).toBeVisible();
    await ownerPage.reload();
    await expect(
      ownerPage.getByText("100%", { exact: true }).first(),
    ).toBeVisible();
    const [[stored]] = await pool.execute(
      "SELECT status FROM tasks WHERE id=?",
      [task.body.id],
    );
    expect(stored.status).toBe("concluída");
    expect(
      (
        await call("/projects/" + project.id, member.token, "PUT", {
          name: "Não permitido",
        })
      ).status,
    ).toBe(403);
    expect(
      (await call("/projects/" + project.id, member.token, "DELETE")).status,
    ).toBe(403);
    await ownerPage.getByRole("tab", { name: "Projetos", exact: true }).click();
    await ownerPage.getByLabel("Pesquisar projetos").fill("nome inexistente");
    await expect(
      ownerPage.getByText("Nenhum projeto encontrado", { exact: true }),
    ).toBeVisible();
    await ownerPage.getByLabel("Pesquisar projetos").fill("Colaboração");
    await expect(
      ownerPage.getByText(project.name, { exact: true }).last(),
    ).toBeVisible();
    await ownerPage
      .getByRole("button", { name: "concluído", exact: true })
      .click();
    await expect(
      ownerPage.getByText("Nenhum projeto encontrado", { exact: true }),
    ).toBeVisible();
    await ownerPage.getByRole("button", { name: "todos", exact: true }).click();
    await ownerPage
      .getByRole("button", { name: "Ciências", exact: true })
      .click();
    await expect(
      ownerPage.getByText(project.name, { exact: true }).last(),
    ).toBeVisible();
    await ownerPage.getByText(project.name, { exact: true }).last().click();
    await expect(
      ownerPage.getByRole("button", { name: "Editar projeto", exact: true }),
    ).toBeVisible();
    await memberAgain.reload();
    await expect(
      memberAgain.getByText("Projetos recentes", { exact: true }),
    ).toBeVisible();
    await memberAgain.getByRole("tab", { name: "Perfil", exact: true }).click();
    await expect(
      memberAgain.getByText("Informações pessoais", { exact: true }),
    ).toBeVisible();
    await memberAgain
      .getByRole("button", { name: "Sair da conta", exact: true })
      .click();
    await expect(
      memberAgain.getByText("Bom ter você por aqui.", { exact: true }),
    ).toBeVisible();
    expect(
      await memberAgain.evaluate(() => localStorage.getItem("deadline.token")),
    ).toBeNull();
    await memberAgain
      .getByLabel("E-mail", { exact: true })
      .fill(owner.user.email);
    await memberAgain
      .getByLabel("Senha", { exact: true })
      .fill("Integration-test-123");
    await memberAgain
      .getByRole("button", { name: "Entrar", exact: true })
      .click();
    await expect(
      memberAgain.getByText("Projetos recentes", { exact: true }),
    ).toBeVisible();
    expect(
      await memberAgain.evaluate(() => localStorage.getItem("deadline.token")),
    ).not.toBe(member.token);
    await memberAgain
      .getByRole("button", { name: "Meu perfil", exact: true })
      .click();
    await expect(
      memberAgain.getByLabel("Nome completo", { exact: true }),
    ).toHaveValue(owner.user.name);
    await expect(
      memberAgain.getByText(project.name, { exact: true }).last(),
    ).toBeVisible();
    await memberAgain
      .getByLabel("Nome completo", { exact: true })
      .fill("Equipe owner revisada");
    await memberAgain
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await expect(
      memberAgain.getByText("Perfil atualizado.", { exact: true }),
    ).toBeVisible();
    const [[updatedProfile]] = await pool.execute(
      "SELECT name FROM users WHERE id=?",
      [owner.user.id],
    );
    expect(updatedProfile.name).toBe("Equipe owner revisada");
    await memberAgain.getByRole("tab", { name: "Sair", exact: true }).click();
    await memberAgain
      .getByRole("button", { name: "Sair e trocar de conta", exact: true })
      .click();
    await expect(
      memberAgain.getByText("Bom ter você por aqui.", { exact: true }),
    ).toBeVisible();
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    if (project)
      await pool.execute("DELETE FROM projects WHERE id=?", [project.id]);
    for (const account of accounts)
      await pool.execute("DELETE FROM users WHERE id=?", [account.user.id]);
    await pool.end();
  }
});
