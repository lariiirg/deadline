const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('../backend/node_modules/mysql2/promise');
const dotenv = require('../backend/node_modules/dotenv');
const root = path.resolve(__dirname, '..');

function envValue(value) {
  for (const quote of ["'", '"', '`']) {
    const candidate = quote + value + quote;
    if (dotenv.parse('VALUE=' + candidate).VALUE === value) return candidate;
  }
  throw new Error('A senha tem uma combinação de caracteres incompatível com .env. Configure uma senha sem misturar os três tipos de aspas.');
}

async function main() {
  const password = process.env.DEADLINE_SETUP_PASSWORD;
  if (password === undefined) throw new Error('Execute scripts/configurar-banco.ps1 para informar a senha com segurança.');
  const encodedPassword = envValue(password);
  const envPath = path.join(root, 'backend/.env');
  let content = fs.readFileSync(fs.existsSync(envPath) ? envPath : path.join(root, 'backend/.env.example'), 'utf8');
  const config = dotenv.parse(content);
  const connection = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'admin', password, multipleStatements: true });
  try {
    await connection.query(fs.readFileSync(path.join(root, 'database/deadline.sql'), 'utf8'));
  } finally {
    await connection.end();
  }
  const replacements = {
    DB_HOST: '127.0.0.1', DB_PORT: '3307', DB_USER: 'admin',
    DB_PASSWORD: encodedPassword, DB_NAME: 'deadline', PORT: '3000',
    JWT_SECRET: config.JWT_SECRET && config.JWT_SECRET.length >= 32 && !config.JWT_SECRET.startsWith('gere_')
      ? envValue(config.JWT_SECRET) : crypto.randomBytes(48).toString('hex'),
  };
  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp('^' + key + '=.*$', 'm');
    content = pattern.test(content) ? content.replace(pattern, () => key + '=' + value) : content + '\n' + key + '=' + value;
  }
  fs.writeFileSync(envPath, content, 'utf8');
  const appEnv = path.join(root, 'app/.env');
  if (!fs.existsSync(appEnv)) fs.copyFileSync(path.join(root, 'app/.env.example'), appEnv);
  console.log('Banco criado/verificado na porta 3307 e backend/.env configurado. Pode iniciar a API.');
}
main().catch(error => {
  const messages = {
    ER_ACCESS_DENIED_ERROR: 'Senha incorreta ou usuario admin sem acesso ao MySQL. Execute novamente com a senha correta.',
    ECONNREFUSED: 'MySQL indisponivel. Inicie o servico MySQL80 na porta 3307 e execute novamente.',
    ER_DBACCESS_DENIED_ERROR: 'O usuario admin precisa de permissao para criar o banco deadline.',
    ER_TABLEACCESS_DENIED_ERROR: 'O usuario admin precisa de permissao para criar as tabelas.',
  };
  console.error(messages[error.code] || 'Falha na configuracao: ' + (error.code || error.message));
  process.exitCode = 1;
});
