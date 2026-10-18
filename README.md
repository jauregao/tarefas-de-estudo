# Tarefas de estudo

Aplicação para organizar tarefas de estudo. Permite cadastrar tarefas, consultar a lista e marcar itens como concluídos, mantendo os dados em PostgreSQL.

## Funcionalidades

- Cadastro de tarefas com título obrigatório.
- Listagem de tarefas pendentes e concluídas.
- Conclusão de tarefas.
- Edição e exclusão de tarefas.
- Cadastro e login com nome, e-mail e senha.
- Tarefas isoladas por conta autenticada.
- Mensagens de validação, carregamento e erro na interface.

As senhas são armazenadas como hashes pelo ASP.NET Core Identity. A API exige autenticação para operações de tarefas e só consulta ou altera tarefas pertencentes à pessoa autenticada. Títulos vazios ou compostos apenas por espaços são rejeitados.

## Arquitetura

```text
Angular → HTTP/JSON → API ASP.NET Core → Entity Framework Core/Npgsql → PostgreSQL
```

O frontend apresenta os dados e envia requisições à API. O backend valida as operações e persiste as tarefas por meio do Entity Framework Core. As migrations descrevem o esquema do banco.

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Frontend | Angular 21, TypeScript e CSS |
| Backend | ASP.NET Core 10, Entity Framework Core 10 e Npgsql |
| Banco de dados | PostgreSQL |
| Testes do frontend | Vitest, Angular TestBed e HTTP simulado |
| Testes do backend | xUnit, WebApplicationFactory e SQLite temporário para integração |

## Estrutura

```text
back/                         API, regras, persistência e migrations
front/                        Interface Angular e seus testes
tests/Tarefas.Api.Tests/       Testes unitários e de integração do backend
docs/                         Imagens da aplicação
Tarefas.sln                   Solução .NET
```

## Execução e testes

As instruções de instalação, configuração, execução, build e testes estão nos READMEs de cada aplicação:

- [Frontend](front/README.md)
- [Backend](back/README.md)

Para usar a aplicação completa, iniciar a API e o frontend em terminais separados. Os endereços locais padrão são `http://localhost:4200` para a interface e `http://localhost:5027/api/tarefas` para a API.

Os testes podem ser executados sem iniciar esses servidores ou configurar um banco PostgreSQL. Os testes de integração usam um banco SQLite temporário e verificam cadastro, login, proteção da API e isolamento de tarefas por usuário.
