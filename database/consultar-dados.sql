-- Execute na conexão 127.0.0.1:3307 do Workbench.
-- Estas são as tabelas usadas pela API atual.
SELECT @@hostname AS servidor, @@port AS porta;
SELECT id, name, email, account_type, created_at FROM deadline.users;
SELECT * FROM deadline.projects;
SELECT * FROM deadline.tasks;
SELECT * FROM deadline.project_members;
