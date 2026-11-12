const { test, expect } = require("@playwright/test");
test("real API + MySQL: register, create and edit project, task, calendar and delete with SQL verification", async ({
  page,
}) => {
  test.skip(
    process.env.RUN_DB_BROWSER !== "1",
    "Requires the isolated MySQL runner.",
  );
  const stamp = Date.now();
  const { pool } = await import("../../backend/config/db.js");
  const cleanup = async () => {
    const [users] = await pool.execute("SELECT id FROM users WHERE email=?", [
      `browser-live-${stamp}@example.com`,
    ]);
    for (const user of users) {
      await pool.execute("DELETE FROM projects WHERE owner_id=?", [user.id]);
      await pool.execute("DELETE FROM users WHERE id=?", [user.id]);
    }
    await pool.end();
  };
  try {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Criar conta", exact: true })
      .click();
    await page
      .getByLabel("Nome completo", { exact: true })
      .fill("Teste completo");
    await page
      .getByLabel("E-mail", { exact: true })
      .fill(`browser-live-${stamp}@example.com`);
    await page
      .getByLabel("Senha", { exact: true })
      .fill("Integration-test-123");
    await page
      .getByLabel("Confirme sua senha", { exact: true })
      .fill("Integration-test-123");
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(
      page.getByText("Projetos recentes", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Novo projeto", exact: true })
      .click();
    await page
      .getByLabel("Nome do projeto", { exact: true })
      .fill("Projeto real " + stamp);
    await page.getByLabel("Matéria", { exact: true }).fill("História");
    await page.getByLabel("Tema", { exact: true }).fill("Pesquisa");
    await page
      .getByLabel("Descrição", { exact: true })
      .fill("Persistência real no MySQL.");
    await page
      .getByLabel("Data de entrega (AAAA-MM-DD)", { exact: true })
      .fill("2030-12-01");
    await page
      .getByRole("button", { name: "Criar projeto", exact: true })
      .click();
    await expect(
      page.getByText("Nossa equipe · 1", { exact: true }),
    ).toBeVisible();
    const [[storedProject]] = await pool.execute(
      "SELECT id FROM projects WHERE name=?",
      ["Projeto real " + stamp],
    );
    expect(storedProject).toBeTruthy();
    await page
      .getByRole("button", { name: "Editar projeto", exact: true })
      .click();
    await page
      .getByLabel("Nome do projeto", { exact: true })
      .fill("Projeto editado " + stamp);
    await page
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await expect(
      page.getByText("Projeto editado " + stamp, { exact: true }),
    ).toBeVisible();
    const [[updatedProject]] = await pool.execute(
      "SELECT name FROM projects WHERE id=?",
      [storedProject.id],
    );
    expect(updatedProject.name).toBe("Projeto editado " + stamp);
    await page
      .getByRole("button", { name: "Nova tarefa", exact: true })
      .click();
    await page.getByLabel("Título", { exact: true }).fill("Pesquisar fontes");
    await page
      .getByLabel("Descrição", { exact: true })
      .fill("Conferir referências.");
    await page
      .getByRole("button", { name: "Teste completo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Salvar tarefa", exact: true })
      .click();
    await expect(
      page.getByText("Pesquisar fontes", { exact: true }),
    ).toBeVisible();
    const [[storedTask]] = await pool.execute(
      "SELECT id FROM tasks WHERE project_id=? AND title=?",
      [storedProject.id, "Pesquisar fontes"],
    );
    expect(storedTask).toBeTruthy();
    await page.getByRole("button", { name: "concluída", exact: true }).click();
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Projetos recentes", { exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Calendário", exact: true }).click();
    await expect(page.getByText("Compromissos do dia")).toBeVisible();
    await page.getByRole("tab", { name: "Tarefas", exact: true }).click();
    await expect(
      page.getByText("Pesquisar fontes", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Abrir projeto", exact: true })
      .click();
    await expect(page.getByText("100%", { exact: true }).last()).toBeVisible();
    await page
      .getByRole("button", { name: "Excluir projeto", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar exclusão", exact: true })
      .click();
    await expect(
      page.getByText("Tudo organizado por aqui", { exact: true }),
    ).toBeVisible();
    const [remainingProjects] = await pool.execute(
      "SELECT id FROM projects WHERE id=?",
      [storedProject.id],
    );
    const [remainingTasks] = await pool.execute(
      "SELECT id FROM tasks WHERE project_id=?",
      [storedProject.id],
    );
    expect(remainingProjects).toHaveLength(0);
    expect(remainingTasks).toHaveLength(0);
  } finally {
    await cleanup();
  }
});
