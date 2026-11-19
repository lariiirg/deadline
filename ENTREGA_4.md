# Entrega 4 — estado verificado em 19/11/2026

## Resultado e preservação

A mesma aplicação Deadline foi revisada, sem recriar telas, trocar a navegação, alterar o esquema do MySQL ou remover funcionalidades. O banco de desenvolvimento continua em 3307 e a API em 3000. Os testes de interface desta etapa usaram uma API temporária em 3001 para não encerrar a API de desenvolvimento.

**O APK foi gerado com sucesso pelo EAS.** Após o login da proprietária, o projeto foi vinculado à conta `lariigewehr`, ID `26b7f765-eefa-49f1-8a50-ea2c13d66904`. O build `85432b3e-2579-40e4-9a2e-bf72d1a6ebfa` terminou com status `FINISHED`, perfil `apk-lan`, versão 1.0.0 e versionCode 1, a partir do commit `d57b82c8b36483db57bb7222e4acfa27d9a598fd`. A chave de assinatura é gerenciada remotamente pelo EAS.

**Instalação e execução nativa continuam pendentes.** A proprietária informou não ter aparelho Android, e não há SDK/ADB ou emulador configurado neste ambiente. O teste de acesso à API pelo celular também não foi executado; a ausência do teste não comprova falha de rede. O README explica a alternativa de emulador.

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

### Revalidação final antes do commit — 19/11/2026

A pedido da proprietária, os comandos foram executados novamente depois da geração do APK:

- Backend com MySQL real: **27 testes aprovados**, sem falhas ou testes ignorados.
- Configuração APK: **3 testes aprovados**.
- Navegador: **6 cenários aprovados**, incluindo os dois cenários com API/MySQL reais. Em seguida, o cenário de colaboração foi ampliado e passou novamente para verificar a troca real de uma conta pela outra, o clique no perfil do rodapé, os projetos da conta, a edição do perfil persistida no MySQL e a saída pela aba Sair.
- Expo: dependências compatíveis e **20/20 verificações do Expo Doctor aprovadas**.
- Bundles web e Android/Hermes recompilados com sucesso. O build web normal foi restaurado após os testes, e a API temporária 3001 foi encerrada; a API 3000 e o serviço MySQL 3307 foram preservados.
- MySQL **8.0.42**, banco `deadline`, porta **3307**: as cinco tabelas da API usam InnoDB. Leituras de integridade encontraram zero projetos sem criador/convite, zero criadores fora de seus grupos, zero tarefas sem projeto e zero responsáveis fora do grupo. As chaves dos registros existentes foram comparadas antes/depois dos testes: preservadas; os registros temporários foram removidos.
- `/api/health` respondeu com `database: connected` por localhost e pelo IP LAN a partir deste computador.
- Auditoria das dependências de execução do backend: **0 vulnerabilidades reportadas**. Revisão dos arquivos candidatos ao commit: nenhum `.env` nem credencial privada atual encontrado.
- SHA-256 do APK reconferido e igual ao registrado abaixo. O código executável de `app` e `backend` continua igual ao commit `d57b82c`; esta revalidação modifica somente teste de navegador e documentação, sem exigir outro APK.

Não foi encontrada falha funcional nos cenários executados. Isso **não comprova** instalação, teclado, deep linking nativo, persistência ao encerrar o processo Android ou acesso a partir de outro dispositivo: esses itens continuam pendentes, pois não há Android/emulador disponível.

### Matriz consolidada

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
| Login e vinculação EAS | Concluídos após ação da proprietária | Projeto real vinculado em `app/app.json`. |
| EAS Build Android `apk-lan` | **FINISHED** | APK 1.0.0, versionCode 1, build `85432b3e-2579-40e4-9a2e-bf72d1a6ebfa`. |
| Download e conferência do APK | Concluídos | 79.303.715 bytes; ZIP válido com AndroidManifest binário, classes.dex, bundle embarcado e URL `http://10.1.134.84:3000/api` confirmada no próprio bundle. Não equivale a instalação. |
| Revisão de segredos nos arquivos candidatos ao commit | Nenhuma credencial privada atual encontrada; nenhum `.env` incluído | Verificação local sem imprimir os valores privados. |
| Instalação APK / execução nativa | Não executadas | APK disponível; sem aparelho Android ou emulador configurado. |

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
- [x] APK realmente gerado pelo EAS.
- [x] APK baixado e conferido localmente quanto a estrutura, bundle, URL e SHA-256.
- [x] Código do APK identificado: commit `d57b82c`.
- [ ] APK instalado e navegação Android testada.
- [ ] API acessada pelo celular físico.

## Como repetir o build e concluir a instalação

Login, vinculação e geração já foram realizados. As etapas 1 a 5 abaixo servem para repetir o build em outra máquina ou após uma correção; não é necessário gerar outro APK apenas para baixá-lo. Use o link do artefato concluído abaixo. A instalação e os testes das etapas 6 e 7 continuam pendentes.

1. Em `app`, executar `npx.cmd eas-cli@latest login` diretamente no terminal e avisar quando concluir. Nunca compartilhar senha.
2. Vincular a conta/projeto com `npx.cmd eas-cli@latest init` e registrar o ID real em `expo.extra.eas.projectId` caso a CLI peça ajuste manual na configuração dinâmica.
3. Confirmar a rede no navegador do celular e reexecutar `node scripts/configurar-apk.cjs URL_REAL_DA_API` na raiz se o IP mudou.
4. Reiniciar a API após o ajuste de APP_URL. Configurar `app/.env` para LAN se a página de convite for aberta em outros dispositivos e reiniciar o Expo.
5. Com código final commitado, gerar em `app`: `npx.cmd eas-cli@latest build --platform android --profile apk-lan`.
6. Baixar o `.apk` do build concluído, registrar os dados abaixo e instalar no Android.
7. Executar o roteiro Android e preencher evidências. Se houver correções, repetir build/teste e atualizar commit e hash.

### Identificação do artefato (preencher somente quando existir)

- Commit usado no build: `d57b82c8b36483db57bb7222e4acfa27d9a598fd`.
- ID/link EAS: [85432b3e-2579-40e4-9a2e-bf72d1a6ebfa](https://expo.dev/accounts/lariigewehr/projects/deadline/builds/85432b3e-2579-40e4-9a2e-bf72d1a6ebfa).
- Link do APK: [Download oficial no EAS](https://expo.dev/artifacts/eas/9H-35B1CoZ6l20w30OOMbtlnPIFi2VjPDsYsiuk1PWU.apk).
- Caminho local: `artifacts/Deadline-1.0.0.apk` (79.303.715 bytes).
- SHA-256: `A44974B5666179F672391ECE02E6E08F0A2D8A5114C622E9692F7D65CAA529E5`.
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

Os arquivos SQL reais permanecem disponíveis em `database/`. O commit `d57b82c` identifica o código enviado ao EAS; commits posteriores que apenas registram resultados e documentação não alteram o executável. O push final e sua conferência dependem da confirmação de envio. Os resultados antigos estão em `VALIDACAO.md`; esta página é a referência atual para a Entrega 4.
