# Verificação executada — atualização em 12/11/2026

## Verificações mais recentes

- 25 testes do backend passaram: 24 verificações HTTP/validação e um cenário integrado com MySQL real configurado na porta 3307.
- O cenário MySQL inclui cadastro, bcrypt, login, JWT, CRUD, persistência, inclusão por e-mail sem duplicações e diferença de permissão entre aluno e professor integrante.
- A API consulta o nível atual no banco. Alterar o nível do usuário de teste de professor para aluno bloqueou a inclusão com o mesmo token; professor fora do grupo recebeu 404.
- O fluxo de navegador com criação, edição e exclusão de projeto e tarefa foi validado anteriormente nesta sessão com consultas diretas ao MySQL em cada etapa.
- Exportação web recompilada após as mudanças de níveis e inclusão da aba Sair.
- Quatro testes de interface passaram após a inclusão da aba Sair, incluindo remoção do token e novo login. Esses testes usam respostas interceptadas. O cenário de navegador com MySQL real ficou ignorado nessa execução e não foi contado como aprovado novamente.
- A tabela abaixo preserva os resultados anteriores de compilação Android e execução isolada; esses itens não foram repetidos nesta atualização.

## Resultados

| Verificação                                      | Resultado                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| Dependências do backend                          | Instaladas; npm audit sem vulnerabilidades                           |
| Ferramentas de teste na raiz                     | Instaladas; npm audit sem vulnerabilidades                           |
| `expo install --check`                           | Dependências compatíveis com SDK 58                                  |
| Exportação web                                   | Compilação concluída em `app/dist`                                   |
| Exportação Android                               | Bundle compilado em `app/dist-android`; não é um APK                 |
| Testes HTTP de autenticação/validação/permissões | 23 passaram, usando substituto de banco                              |
| Integração com MySQL Server 8.0 real             | 1 cenário completo passou em instância isolada                       |
| Navegação no Microsoft Edge                      | 4 testes passaram com respostas HTTP interceptadas apenas nos testes |
| Navegador + API + MySQL reais                    | 1 teste completo passou sem interceptar as requisições               |

Os primeiros testes identificaram uma tag JSX sem fechamento e rótulos de navegação que incluíam o caractere do ícone. Ambos foram corrigidos e os testes correspondentes passaram. Um seletor do teste de progresso também foi ajustado para a tela de detalhes atual.

## O que a integração real verificou

- Importação do SQL duas vezes sem apagar dados.
- Criação de contas aluno/professor, rejeição de e-mail duplicado, login e rejeição de senha incorreta.
- Senha armazenada como hash bcrypt e comparação real com a senha original.
- Criação de projeto, inclusão automática do criador, convite e entrada de outro usuário.
- Entrada repetida sem duplicação de integrantes.
- Bloqueio de consulta por não integrante e bloqueio de operações administrativas por integrante.
- Criação/edição/exclusão de tarefas pelo criador, conclusão pelo responsável e progresso 100%.
- Leitura direta do banco confirmando a persistência do status.
- Dashboard, calendário, atualização de perfil e edição/exclusão de projeto.
- Fluxo completo no Edge: cadastro → projeto → tarefa atribuída → conclusão → recarregamento → consulta nas tarefas → exclusão.

O executor iniciou um servidor MySQL separado, vinculado a `127.0.0.1:13307`, e uma API temporária na porta 3000. Esses processos foram encerrados ao terminar. O serviço MySQL80 da porta 3307 permaneceu sem alterações. Dados e logs temporários ficam ignorados pelo Git em `artifacts/`.

## Conexão local validada

O MySQL local em **127.0.0.1:3307**, banco `deadline`, foi validado com a configuração privada de `backend/.env`. Cadastro, edição e exclusão foram confirmados com leituras diretas no banco. A API usa `users`, `projects`, `project_members`, `invitations` e `tasks`. Tabelas antigas em português não são usadas. A estrutura existente foi preservada.

Em outra instalação, configure seu próprio `backend/.env`, importe `database/deadline.sql` e inicie a API seguindo o README. Os arquivos `.env` privados não devem ser enviados ao Git.

## Limites dos testes

- Nenhum aparelho Android/iOS físico ou emulador foi usado. Houve compilação Android e teste de layout móvel no navegador.
- Deep links nativos foram implementados com esquema `deadline` e captura de URL inicial/eventos, incluindo tratamento de URLs de desenvolvimento do Expo. A abertura pelo sistema operacional não foi testada em aparelho.
- O convite web foi testado atravessando login e entrada no grupo. Compartilhamento entre dois aparelhos numa rede Wi-Fi real não foi testado; exige os endereços LAN e firewall documentados.
- Publicação em hospedagem, lojas, domínio HTTPS e associações Universal Links/App Links não foram configuradas.
- `npm audit` do app reportou **5 ocorrências moderadas**, relacionadas a `glob`/`minimatch` em dependências transitivas das ferramentas Expo. Não houve ocorrência alta/crítica no relatório consultado. Não foi aplicada a sugestão automática de downgrade forçado do Expo; as versões compatíveis estão fixadas no lockfile. Reavalie ao atualizar o SDK.

## Repetir

Na raiz, após instalar dependências do backend, app e raiz:

```powershell
npm.cmd run test:api
npm.cmd --prefix app run build:web
npm.cmd run test:web
node scripts/test-mysql-isolated.cjs
```

O comando comum `test:api` ignora a integração MySQL por padrão; o executor isolado a executa de verdade. O comando comum `test:web` ignora o cenário com API real; o executor isolado o habilita. Esses skips são intencionais e não foram contados como testes aprovados.
