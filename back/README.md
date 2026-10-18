# Backend — Tarefas de estudo

API ASP.NET Core com Entity Framework Core e Npgsql para persistência em PostgreSQL. Consulte o [README principal](../README.md) para conhecer a arquitetura da aplicação.

## Pré-requisitos

- .NET SDK 10.0 compatível com o `global.json` da raiz.
- PostgreSQL disponível localmente ou em um serviço como Neon.

Os comandos abaixo devem ser executados na pasta `back` do projeto. No Visual Studio Code, abra a pasta do projeto-base e selecione **Terminal → Novo Terminal**. No PowerShell, entre na pasta `back`:

```powershell
cd back
```

Se o terminal já estiver aberto dentro de `back`, não repita esse comando.

## 1. Conferir as ferramentas e restaurar dependências

Confirme se o .NET SDK está instalado:

```powershell
dotnet --version
```

O projeto usa .NET 10. Se o comando não for reconhecido ou mostrar outra versão principal, instale o SDK indicado no `global.json` da raiz do projeto e abra um novo terminal.

Restaure os pacotes e a ferramenta Entity Framework usada para criar as tabelas:

```powershell
dotnet restore ../Tarefas.sln
dotnet tool restore
```

O segundo comando instala localmente a ferramenta `dotnet-ef` indicada no manifesto da raiz. Os comandos abaixo pressupõem que esse passo terminou sem erros.

## 2. Preparar o PostgreSQL local

Instale o servidor PostgreSQL pelo [download oficial para Windows](https://www.postgresql.org/download/windows/). Durante a instalação, defina a senha local do usuário `postgres` como `postgres` para usar os comandos deste roteiro. Essa senha é somente para o ambiente local de estudo.

Baixe o [Beekeeper Studio Portable para Windows — releases](https://github.com/beekeeper-studio/beekeeper-studio/releases/latest) (escolha o arquivo que termina em `-portable.exe`). No Beekeeper, conecte-se ao servidor local em `localhost`, porta `5432`, usuário `postgres` e senha `postgres`. Abra uma consulta SQL e crie o banco:

```sql
CREATE DATABASE tarefas;
```

Se `tarefas` já existir, não execute o comando novamente.

## 3. Salvar a conexão com User Secrets

Os comandos abaixo devem ser executados na pasta `back` do projeto. A aplicação guarda a conexão fora dos arquivos versionados:

```powershell
dotnet user-secrets set "ConnectionStrings:Tarefas" "Host=localhost;Port=5432;Database=tarefas;Username=postgres;Password=postgres"
```

O projeto já tem um identificador para User Secrets; não é necessário executar `dotnet user-secrets init`. Essa configuração é para o banco local de estudo. Em produção, configure `ConnectionStrings__Tarefas` no painel do serviço que hospeda a API; não coloque a conexão de produção no código ou no frontend.

## 4. Criar as tabelas do projeto

Ainda na pasta `back`, restaure a ferramenta Entity Framework e aplique as migrations:

```powershell
dotnet tool restore
dotnet ef database update -- --environment Development
```

As migrations ficam em `Migrations/` e criam as tabelas usadas pela aplicação. Iniciar a API não cria as tabelas automaticamente.

## 5. Iniciar a API

Ainda na pasta `back`, execute:

```powershell
dotnet run --launch-profile http
```

A API estará disponível em `http://localhost:5027`. O perfil `http` inicia no ambiente local de desenvolvimento e carrega User Secrets. Mantenha esse terminal aberto enquanto usa a aplicação. Para encerrar a API, pressione `Ctrl+C`.

## Endpoints

| Método e rota | Corpo | Resposta de sucesso |
| --- | --- | --- |
| `GET /api/tarefas` | Sem corpo | `200`, lista ordenada por ID |
| `POST /api/tarefas` | `{"titulo":"Estudar Git"}` | `201`, tarefa criada e pendente |
| `PATCH /api/tarefas/{id}` | `{"titulo":"Revisar Git"}` | `200`, tarefa atualizada |
| `PATCH /api/tarefas/{id}/concluir` | Sem campos obrigatórios | `200`, tarefa concluída |
| `PATCH /api/tarefas/{id}/reabrir` | Sem campos obrigatórios | `200`, tarefa reaberta |
| `DELETE /api/tarefas/{id}` | Sem corpo | `204`, tarefa apagada |

Uma tarefa contém `id`, `titulo` e `concluida`. Títulos ausentes, vazios ou só com espaços retornam `400`. Atualizar, concluir ou apagar um ID que não existe ou pertence a outra conta retorna `404`. Repetir a conclusão de uma tarefa mantém seu estado concluído.

Todas as rotas de tarefas exigem `Authorization: Bearer <accessToken>`. Sem uma sessão válida, a API responde `401`. A identidade oferece:

| Método e rota | Corpo | Uso |
| --- | --- | --- |
| `POST /api/auth/register` | `{"nome":"Ana","email":"ana@example.com","senha":"abcd"}` | Cria a conta; a senha precisa ter no mínimo 4 caracteres. |
| `POST /api/identity/login?useCookies=false` | `{"email":"ana@example.com","password":"SenhaForte123!"}` | Valida as credenciais e retorna tokens bearer. |
| `GET /api/auth/me` | Sem corpo | Retorna o perfil associado ao token. |

O frontend cadastra a conta e inicia a sessão. A senha em texto puro é usada somente na requisição de cadastro/login; o banco guarda o hash criado pelo Identity. O token de acesso fica em `sessionStorage` e é enviado pela aplicação no header `Authorization`.

As chaves de proteção usadas pelos tokens ficam na tabela `DataProtectionKeys`, para que a API consiga validá-los após reiniciar. Em produção, o acesso ao banco deve ser restrito ao serviço da API.

Requisições de exemplo estão em [Tarefas.http](Tarefas.http).

## Testes

Executar todos os testes do backend:

```powershell
dotnet test ../Tarefas.sln --configuration Release
```

Executar apenas os testes unitários:

```powershell
dotnet test ../Tarefas.sln --filter "Category=Unit"
```

Os comandos terminam automaticamente e retornam código de saída diferente de zero quando há falhas. Não é necessário iniciar a API ou configurar PostgreSQL.

- `TarefaServiceTests.cs`: valida títulos inválidos antes de acessar a persistência.
- `TarefasTests.cs`: verifica cadastro, login, proteção contra acesso anônimo, isolamento entre usuários, hash de senha e persistência, usando SQLite temporário isolado.

Os testes de integração não acessam o banco da aplicação nem validam o provedor PostgreSQL.

## Build

```powershell
dotnet build --configuration Release
```

## Problemas comuns

| Sintoma | Verificação |
| --- | --- |
| Conexão ausente | Configurar `ConnectionStrings:Tarefas` em User Secrets ou `ConnectionStrings__Tarefas` no ambiente |
| Tabela inexistente | Aplicar as migrations ao banco configurado |
| Falha de autenticação no banco | Conferir usuário, senha, host, banco e configuração de TLS |
| Porta 5027 ocupada | Encerrar a outra instância antes de iniciar a API |
| SDK não encontrado | Conferir `dotnet --list-sdks` e instalar o SDK indicado nos pré-requisitos |
