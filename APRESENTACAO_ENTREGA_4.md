# Apresentação do Deadline — Entrega 4

## Antes de apresentar

Reserve de 8 a 12 minutos. Use duas contas de demonstração, uma como criadora e outra como integrante, sem mostrar senhas reais. Deixe API e MySQL ligados e os dispositivos na mesma rede. Consulte `ENTREGA_4.md` para distinguir testes executados de pendências. Confira a branch `main` no GitHub.

O APK só deve ser anunciado como pronto depois que existir um arquivo `.apk` e ele for instalado. Até lá, apresente a configuração de build como preparada, não como APK gerado.

## 1. Introdução — aproximadamente 1 minuto

“Meu projeto se chama Deadline. Eu escolhi esse tema porque, nos trabalhos em grupo da escola, às vezes fica confuso saber quem vai fazer cada parte e quando precisa entregar. O objetivo do aplicativo é juntar os projetos, os prazos e as tarefas em um lugar só, para cada integrante conseguir acompanhar sua responsabilidade e o andamento do grupo.”

“O público principal são estudantes e professores. Eu mantive uma interface com cartões e navegação adaptada para computador e celular.”

## 2. Demonstração — aproximadamente 5 minutos

1. **Cadastro:** mostrar os campos e a escolha de aluno ou professor. “A senha não fica salva em texto puro no banco.” Mostrar uma validação de campo vazio ou confirmação de senha, sem expor dados reais.
2. **Login:** entrar com uma conta de demonstração. “Depois do login, o aplicativo recebe um token para identificar minha sessão.”
3. **Dashboard:** explicar as contagens, os próximos prazos e o progresso.
4. **Projeto:** criar um projeto com nome, matéria, tema, descrição e prazo. Abrir os detalhes. “Como eu criei, sou a administradora deste projeto.”
5. **Convite:** mostrar código e link. Na outra sessão, abrir o convite, entrar ou cadastrar uma conta e confirmar a participação. O e-mail também pode incluir uma conta já existente pela seção Nossa equipe.
6. **Tarefa:** a criadora adiciona uma tarefa, define prazo e atribui ao outro integrante.
7. **Colaboração:** na conta integrante, abrir Tarefas e marcar a atividade como concluída. Reabrir ou atualizar a tela da criadora para ver o progresso. “A atualização acontece quando a tela consulta a API; não é sincronização em tempo real por WebSocket.”
8. **Permissões:** mostrar que a integrante não possui botões de administração. “Mesmo tentando chamar a API por fora da interface, o backend bloqueia.”
9. **Calendário:** selecionar o dia da entrega e abrir o projeto correspondente.
10. **Perfil:** clicar na conta no rodapé ou na aba Perfil. Mostrar informações e projetos. Editar um dado de demonstração se desejar.
11. **CRUD:** editar o nome do projeto; excluir uma tarefa de demonstração e confirmar. Mostrar que a exclusão do projeto pede confirmação e remove os registros relacionados.
12. **Logout:** usar Sair da conta. “Agora o token foi removido deste dispositivo e voltei ao login inicial para entrar em outra conta.”

## 3. Explicação técnica — aproximadamente 2 minutos

“A interface foi feita com React Native e Expo. Para acessar os dados, o aplicativo usa fetch e manda requisições para uma API REST em Node.js com Express. A API é quem conversa com o MySQL. O celular não acessa o banco diretamente.”

“O backend roda na porta 3000 e o MySQL na 3307 no desenvolvimento. As entidades principais são usuários, projetos, participações, convites e tarefas. A participação relaciona usuários e projetos, porque um usuário pode participar de vários grupos.”

“CRUD significa criar, consultar, atualizar e excluir. Eu uso POST, GET, PUT e DELETE conforme a operação. Para mudar somente o status da tarefa, existe uma rota PATCH.”

“No cadastro, o bcrypt transforma a senha em um hash. No login, ele compara a senha digitada com esse hash. O JWT é um token assinado com prazo de validade de sete dias. O aplicativo envia esse token no cabeçalho Authorization, como Bearer Token. O middleware confere assinatura e validade antes de liberar as rotas.”

“Aluno e professor podem criar e participar de projetos. O criador administra seu projeto e suas tarefas. Um professor integrante também pode adicionar integrantes. Isso não libera acesso a grupos dos quais ele não participa. No projeto escolar, o tipo de conta é escolhido no cadastro; não implementei verificação institucional de professor.”

## 4. Testes e versionamento — aproximadamente 1 minuto

“Eu usei Git e GitHub para guardar o código e registrar as entregas. O repositório é lariiirg/deadline e a versão atual está na branch main. Não envio o arquivo .env com as senhas.”

“Os testes verificam autenticação, permissões e CRUD. Também há testes que abrem o navegador e usam API e MySQL reais, com duas sessões e registros temporários. Os resultados desta entrega estão em ENTREGA_4.md. Um teste de layout móvel no navegador não substitui o teste no Android.”

Mostre os commits existentes sem afirmar que cada etapa foi um commit separado se o histórico não mostrar isso. Mostre o resultado real dos testes, não só o código dos testes.

## 5. APK e Android

Se o build **ainda estiver pendente**, dizer: “Configurei o EAS com um perfil que gera APK e um endereço de API da rede local. A geração e a instalação ainda dependem das etapas marcadas no checklist. Não estou apresentando um bundle JavaScript como se fosse um APK.”

Se o APK **tiver sido gerado e testado**, preencher antes de apresentar:

- ID/link do build: ____________________
- Commit do código enviado ao build: ____________________
- SHA-256 do APK: ____________________
- Celular e versão do Android: ____________________
- Data do teste: ____________________

Então explicar: “O APK foi gerado pelo EAS Build no perfil apk-lan. Ele roda sem o Expo Go, mas precisa alcançar a API do computador na mesma rede. Não funciona fora dessa rede sem hospedar o backend. Eu instalei o arquivo e testei as funcionalidades que estão marcadas no checklist.”

Não demonstre uma instalação que não foi feita. O pacote atual é `com.deadline.school`, versão 1.0.0, versionCode 1.

## 6. Conclusão

“O Deadline ajuda a organizar os trabalhos, distribuir as tarefas e acompanhar os prazos. Durante o desenvolvimento, aprendi como uma interface conversa com uma API, como os dados são salvos no banco e por que as permissões precisam ser verificadas no servidor. Também aprendi a testar o fluxo completo, e não só verificar se a tela abre.”

## Perguntas que o professor pode fazer

| Pergunta | Resposta sugerida |
| --- | --- |
| O que é uma API? | É a parte que recebe as requisições do aplicativo, verifica as regras e acessa o banco. |
| Por que o celular não acessa o MySQL? | Porque as credenciais e as regras ficam no backend. O app só usa os endpoints autorizados. |
| O que é REST? | É uma forma de organizar os recursos da API usando rotas e métodos HTTP. |
| O que é CRUD? | Criar, consultar, atualizar e excluir os dados. |
| O que é JWT? | É um token assinado que identifica a sessão e tem validade. Não é a senha do usuário. |
| JWT é criptografia? | A assinatura impede alterações válidas sem a chave. O conteúdo do token pode ser lido, então não guardo senha nele. |
| O que significa Bearer? | É o formato usado para enviar o token no cabeçalho Authorization. Quem tem um token válido pode usá-lo até ele expirar. |
| O que é middleware? | É uma função executada antes das rotas. O middleware de autenticação valida o token. |
| O que é hash? | É uma transformação usada para não guardar a senha original. O bcrypt permite verificar uma senha sem recuperar o texto original. |
| Esconder o botão já protege? | Não. O servidor também precisa negar a operação. |
| Como evita SQL injection? | Os valores recebidos são passados como parâmetros das consultas. |
| Por que existem duas tabelas para grupo e pessoas? | project_members liga usuários e projetos sem repetir os dados da conta. |
| O que acontece ao excluir um projeto? | As tarefas, participações e o convite relacionados são removidos por cascata. |
| O logout invalida todas as cópias do token? | Não. Ele remove a cópia local. Não há lista de revogação; outra cópia válida expira em sete dias. |
| Posso usar fora do Wi-Fi? | Neste perfil LAN, não. Para isso, seria preciso hospedar a API com HTTPS e gerar o build com a URL pública. |
| O APK é igual ao bundle Android? | Não. O bundle JavaScript valida a compilação; o APK é o pacote instalável do Android. |
| O que ainda pode melhorar? | Hospedagem HTTPS, verificação institucional de professor, revogação de sessão e testes em mais aparelhos. |
