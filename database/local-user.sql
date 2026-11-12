-- Execute com uma conta administrativa no Workbench.
-- Troque a senha ANTES de executar. Não altera o usuário admin existente.
CREATE USER IF NOT EXISTS 'deadline_app'@'localhost' IDENTIFIED BY 'TROQUE_POR_UMA_SENHA_FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE ON deadline.* TO 'deadline_app'@'localhost';
