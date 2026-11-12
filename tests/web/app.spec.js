const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
fs.mkdirSync("artifacts", { recursive: true });
// Browser tests use intercepted API responses solely as test fixtures. The app
// itself has no mock mode. Live persistence is covered by the MySQL test.
const user = {
  id: 1,
  name: "Pessoa de teste",
  email: "browser@example.com",
  account_type: "aluno",
  created: 0,
  participating: 0,
};
async function fixture(page) {
  await page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    let data;
    if (p.endsWith("/auth/login")) data = { token: "browser-test-token", user };
    else if (p.endsWith("/profile")) data = user;
    else if (p.endsWith("/dashboard"))
      data = { projects: [], active: 0, completed: 0, near: 0, progress: 0 };
    else data = [];
    await route.fulfill({ json: data });
  });
}
test("desktop: login, dashboard, projects, calendar, profile and logout", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fixture(page);
  await page.goto("/");
  await expect(page.getByText("Bom ter você por aqui.")).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByText("Projetos recentes", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Projetos", exact: true }).click();
  await expect(page.getByText("Meus projetos", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Criar projeto", exact: true })
    .click();
  await expect(page.getByText("Um novo começo")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("tab", { name: "Calendário", exact: true }).click();
  await expect(page.getByText("Compromissos do dia")).toBeVisible();
  await page.getByRole("button", { name: "Meu perfil", exact: true }).click();
  await expect(page.getByText("Informações pessoais")).toBeVisible();
  await expect(page.getByText("Você ainda não participa de nenhum projeto.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sair da conta", exact: true }).click();
  await expect(page.getByText("Bom ter você por aqui.")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("deadline.token")),
  ).toBeNull();
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByText("Projetos recentes", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("registration validates password confirmation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Nome completo", { exact: true }).fill("Teste");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("password123");
  await page
    .getByLabel("Confirme sua senha", { exact: true })
    .fill("different");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "As senhas não coincidem",
  );
});
test("mobile: bottom navigation and project filters render without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(page);
  await page.addInitScript(() =>
    localStorage.setItem("deadline.token", "browser-test-token"),
  );
  await page.goto("/");
  await expect(
    page.getByRole("tab", { name: "Início", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Projetos", exact: true }).click();
  await expect(page.getByLabel("Pesquisar projetos")).toBeVisible();
  await page.screenshot({
    path: "artifacts/projetos-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("invitation survives login and joins the project", async ({ page }) => {
  await fixture(page);
  const project = {
    id: 10,
    name: "Projeto de teste",
    subject: "Ciências",
    topic: "Tema",
    description: "Descrição",
    owner_id: 2,
    status: "pendente",
    due_date: "2030-12-01",
    progress: 0,
    members: [user],
    tasks: [],
  };
  await page.route("**/api/invitations/join", (r) =>
    r.fulfill({ json: project }),
  );
  await page.route("**/api/projects/10", (r) => r.fulfill({ json: project }));
  await page.goto("/?invite=ABCDEF0123456789");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByLabel("Código do convite")).toHaveValue(
    "ABCDEF0123456789",
  );
  await page
    .getByRole("button", { name: "Entrar no projeto", exact: true })
    .click();
  await expect(
    page.getByText("Projeto de teste", { exact: true }),
  ).toBeVisible();
});
