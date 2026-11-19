# Entrega 4 — estado verificado em 19/11/2026

## Resultado e preservação

A mesma aplicação Deadline foi revisada, sem recriar telas, trocar a navegação, alterar o esquema do MySQL ou remover funcionalidades. O banco de desenvolvimento continua em 3307 e a API em 3000. Os testes de interface desta etapa usaram uma API temporária em 3001 para não encerrar a API de desenvolvimento.

**O APK ainda não existe.** O perfil EAS está preparado, mas `eas whoami` retornou `Not logged in`. Não há Android SDK/ADB ou dispositivo configurado neste ambiente para instalação. O login na conta Expo deve ser feito pela proprietária, sem compartilhar senha. Depois é necessário vincular o projeto, gerar e baixar o APK e testar no celular.

## Alterações necessárias feitas

- Correções compatíveis dentro do SDK 58: Expo 58.0.26, Linking 58.0.17 e StatusBar 58.0.5.
- Inclusão direta de `expo-font`, exigida pelos ícones em builds nativos; o Expo Doctor detectou a ausência e passou depois da correção.
- Perfil `apk-lan` de distribuição interna com `android.buildType: apk`; perfil `apk` para futura API HTTPS.
- Configuração dinâmica preservando `app.json`, pacote `com.deadline.school`, versão 1.0.0 e versionCode 1.
- Ícones de ampulheta em PNG e ícone adaptativo com a identidade já usada pelo app; sem alterações nas telas.
- Formulários roláveis preservam toques em botões com o teclado aberto; Android usa ajuste de layout `resize`. O comportamento físico ainda precisa ser testado no celular.
- Validação que bloqueia build APK com API ausente, URL inválida, credenciais embutidas, localhost ou endereço de emulador. HTTP só é habilitado pelo perfil LAN.
- Script de configuração LAN que confere a saúde da API e atualiza os endereços públicos necessários aos convites, sem mudar credenciais ou dados do banco.
- Validação adicional de identificador no JWT: assinatura válida com subject inválido retorna 401.
- Teste real com duas sessões de navegador, retomada da sessão, convite, tarefa, progresso, filtros e logout.
- README ampliado, roteiro de apresentação, checklist Android e proteção de arquivos privados no Git/EAS.

## Resultados realmente executados

| Verificação | Resultado | Alcance |
| --- | --- | --- |
| API em `http://10.1.134.84:3000/api/health` | Respondeu com banco conectado | Acesso a partir do computador; não comprova acesso do celular. |
| `RUN_DB_TESTS=1 npm.cmd --prefix backend test` | **27 passaram**, nenhum ignorado | 26 testes HTTP/validação e um cenário MySQL real com contas temporárias. |
| `npm.cmd run test:config` | **3 passaram** | URLs e perfis APK, HTTPS/HTTP e preservação da configuração. |
| Playwright com `RUN_DB_BROWSER=1` e API de teste 3001 | **6 passaram**, nenhum ignorado | 4 testes com respostas interceptadas e 2 com API/MySQL reais. |
| `npx.cmd expo install --check` | Dependências compatíveis | SDK 58 após atualizações. |
| `npx.cmd expo-doctor@latest` | **20/20 verificações passaram** | Depois de instalar/configurar expo-font. Não equivale a rodar em aparelho. |
| Exportação web | Concluída | Bundle usado nos testes de navegador. |
| Exportação Android com Hermes, perfil apk-lan | Concluída em `app/dist-android` | Bundle compilado; **não é APK**. |
| Introspecção Expo do perfil apk-lan | Concluída | Manifest gerado contém `android:usesCleartextTraffic=true`; sem gerar projeto Android na pasta. |
| `npm.cmd audit --omit=dev` no backend | 0 vulnerabilidades reportadas | Dependências de execução na data da consulta. |
| `npm.cmd audit --json` no app | 3 ocorrências moderadas; 0 altas/críticas | Cadeia Expo/fingerprint/minimatch. Sem downgrade forçado do SDK. |
| `eas whoami` | `Not logged in` | Build EAS depende de login da proprietária. |
| Revisão de segredos nos arquivos candidatos ao commit | Nenhuma credencial privada atual encontrada; nenhum `.env` incluído | Verificação local sem imprimir os valores privados. |
| Instalação APK / execução nativa | Não executadas | Sem APK e sem Android disponível. |

As primeiras tentativas de teste/compilação limitadas pelo sandbox foram repetidas com a execução permitida. O cache do Metro foi reconstruído durante a exportação Android. Não foram contadas tentativas com falha como aprovações.

## Cobertura dos testes

- Cadastro válido, campos vazios, confirmação de senha, duplicação de e-mail e senha incorreta.
- Hash bcrypt conferido diretamente no MySQL.
- Rotas sem token, token inválido, expirado e subject inválido.
- Criar/listar/editar/excluir projetos e tarefas com confirmação de persistência.
- Convite real entre duas contas, entrada repetida sem duplicar participação e inclusão por e-mail.
- Conta A cria; B entra pelo convite após login, recebe tarefa e a conclui; A recarrega e vê o progresso.
- B tenta editar/excluir o projeto e a API responde 403; não integrante recebe 404.
- Professor integrante pode adicionar integrantes; aluno integrante não pode; o nível é lido do banco.
- Pesquisas e filtros de matéria/status, dashboard, tarefas, calendário e perfil.
- Logout remove o token e retorna ao login; sessão de navegador reaberta com armazenamento persistido retoma a conta.
- Layout móvel sem rolagem horizontal no viewport testado; navegação desktop e inferior.

O compartilhamento pelo menu nativo do Android, a persistência após encerrar o processo Android, teclado, barras do sistema, deep link aberto pelo sistema operacional e instalação não foram verificados em dispositivo. Os testes web não comprovam esses itens.

## Rede local e limites

A proprietária escolheu usar o APK **na mesma rede Wi-Fi**. Em 19/11/2026 o IPv4 detectado foi `10.1.134.84`. O perfil `apk-lan` aponta para `http://10.1.134.84:3000/api`. A configuração local dos convites foi preparada para a página em `http://10.1.134.84:8081`; reinicie a API para aplicar. O endereço não é uma API pública e pode mudar com DHCP.

No celular, abra `/api/health` nesse endereço antes do build. A rede escolar pode bloquear comunicação entre dispositivos; somente um teste no celular confirma o acesso. O computador precisa ficar ligado, com Node permitido pelo firewall para a rede usada. Para convites via navegador, mantenha a página web 8081 acessível; para entrar pelo código no APK, basta a API. O MySQL não deve ser exposto ao celular.

Não há sincronização por WebSocket, aprovação institucional do nível professor, revogação de todas as cópias do JWT no logout ou hospedagem HTTPS. Esses limites foram mantidos e documentados, sem inventar recursos.

## Checklist da entrega

Itens marcados abaixo se referem à evidência web/API documentada; não significam teste nativo.

- [x] Aplicativo web funcionando e navegação revisada.
- [x] Login e cadastro, hash e JWT verificados.
- [x] Logout para login inicial e retomada da sessão web.
- [x] Dois níveis com permissões distintas preservados.
- [x] Rotas protegidas e permissões no backend.
- [x] CRUD de projetos/tarefas com persistência.
- [x] Convites, integrantes e colaboração com duas contas.
- [x] Atribuição, status e progresso coletivo após atualização da tela.
- [x] Calendário e perfil.
- [x] API e conexão MySQL verificadas.
- [x] Problemas encontrados corrigidos e retestados.
- [x] Interface existente preservada; layout móvel web verificado.
- [x] README, SQL e material de apresentação disponíveis.
- [x] Configuração EAS para APK e bundle Android compilado.
- [ ] Commit final enviado e conferido no GitHub.
- [ ] APK realmente gerado e baixado.
- [ ] APK correspondente ao commit final identificado.
- [ ] APK instalado e navegação Android testada.
- [ ] API acessada pelo celular físico.

## Próximas ações da proprietária para o APK

1. Em `app`, executar `npx.cmd eas-cli@latest login` diretamente no terminal e avisar quando concluir. Nunca compartilhar senha.
2. Vincular a conta/projeto com `npx.cmd eas-cli@latest init` e registrar o ID real em `expo.extra.eas.projectId` caso a CLI peça ajuste manual na configuração dinâmica.
3. Confirmar a rede no navegador do celular e reexecutar `node scripts/configurar-apk.cjs URL_REAL_DA_API` na raiz se o IP mudou.
4. Reiniciar a API após o ajuste de APP_URL. Configurar `app/.env` para LAN se a página de convite for aberta em outros dispositivos e reiniciar o Expo.
5. Com código final commitado, gerar em `app`: `npx.cmd eas-cli@latest build --platform android --profile apk-lan`.
6. Baixar o `.apk` do build concluído, registrar os dados abaixo e instalar no Android.
7. Executar o roteiro Android e preencher evidências. Se houver correções, repetir build/teste e atualizar commit e hash.

### Identificação do artefato (preencher somente quando existir)

- Commit usado no build: **pendente**.
- ID/link EAS: **pendente**.
- Caminho/link do APK: **pendente**.
- SHA-256: **pendente** (`Get-FileHash -Algorithm SHA256 -LiteralPath CAMINHO_DO_APK`).
- Data, aparelho e versão Android: **pendentes**.

### Checklist no APK instalado

- [ ] Instala e abre sem Expo Go/Metro.
- [ ] API health abre no navegador do celular na rede escolhida.
- [ ] Ícones, áreas seguras, teclado e botões legíveis.
- [ ] Cadastro e validações.
- [ ] Login correto/incorreto e mensagens de conexão.
- [ ] Fechar/reabrir o app preserva sessão.
- [ ] Criar, consultar, pesquisar/filtrar, editar e excluir projeto temporário.
- [ ] Compartilhar convite nativo; outra conta entra pelo código/link.
- [ ] Integrantes e níveis respeitados.
- [ ] Criar, atribuir, editar e excluir tarefa temporária.
- [ ] Integrante conclui a própria tarefa; criador vê progresso ao atualizar.
- [ ] Integrante não administra projeto/tarefas de outro criador.
- [ ] Calendário e perfil, incluindo edição.
- [ ] Logout retorna ao login inicial e permite entrar com outra conta.
- [ ] Deep link `deadline://join?invite=CODIGO_REAL` abre e preserva o convite, quando acionado por link externo no aparelho.
- [ ] API indisponível apresenta erro sem indicar sucesso.

## Repositório

Remote existente: `https://github.com/lariiirg/deadline.git`, nome local `origen`, branch `main`. Nenhum force push ou reescrita de histórico faz parte desta entrega. Arquivos .env, dependências, artefatos, APK e chaves privadas estão excluídos. O `.easignore` também exclui backend e banco do envio para a compilação do cliente.

Os arquivos SQL reais permanecem disponíveis em `database/`. O commit local deve descrever as configurações e testes preparados, sem alegar que existe APK. O push final e sua conferência devem ocorrer depois da revisão autorizada. Os resultados antigos estão em `VALIDACAO.md`; esta página é a referência atual para a Entrega 4.
