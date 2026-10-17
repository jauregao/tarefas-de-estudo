# Backend — Tarefas de estudo

API ASP.NET Core com Entity Framework Core e Npgsql para persistência em PostgreSQL. Consulte o [README principal](../README.md) para conhecer a arquitetura da aplicação.

## Pré-requisitos

- .NET SDK 10.0 compatível com o `global.json` da raiz.
- PostgreSQL disponível localmente ou em um serviço como Neon.

Os comandos abaixo devem ser executados na pasta `back`.

## Restaurar dependências

```powershell
dotnet restore ../Tarefas.sln
dotnet tool restore
```

O segundo comando restaura o `dotnet-ef` definido no manifesto de ferramentas da raiz.

## Configurar o banco

Criar um banco PostgreSQL e obter host, porta, nome do banco, usuário e senha. A aplicação lê a chave `ConnectionStrings:Tarefas`, no formato Npgsql.

Exemplo para um PostgreSQL local:

```text
Host=localhost;Port=5432;Database=tarefas;Username=SEU_USUARIO;Password=SUA_SENHA
```

Exemplo para Neon, usando os dados de conexão fornecidos pelo serviço:

```text
Host=SEU_HOST.neon.tech;Port=5432;Database=SEU_BANCO;Username=SEU_USUARIO;Password=SUA_SENHA;SSL Mode=VerifyFull
```

Usar uma conexão direta para aplicar migrations. A configuração espera os pares `chave=valor`, em vez de uma URI `postgresql://`.

Para salvar a conexão em User Secrets sem exibi-la no terminal, no PowerShell:

```powershell
$conexaoSegura = Read-Host 'Cole a conexão Npgsql' -AsSecureString
$configuracao = @{
  'ConnectionStrings:Tarefas' = [System.Net.NetworkCredential]::new('', $conexaoSegura).Password
}
$configuracao | ConvertTo-Json -Compress | dotnet user-secrets set
Remove-Variable conexaoSegura, configuracao
```

O projeto já possui `UserSecretsId`; não é necessário executar `dotnet user-secrets init`. User Secrets mantém a configuração fora do repositório, mas não criptografa seu conteúdo. Não versionar conexões com credenciais reais.

A aplicação também aceita a variável de ambiente `ConnectionStrings__Tarefas`, equivalente à chave de configuração.

## Aplicar migrations

Com o banco configurado:

```powershell
dotnet ef database update -- --environment Development
```

As migrations ficam em `Migrations/`. Esse comando cria ou atualiza as tabelas no banco configurado; iniciar a API não aplica migrations automaticamente.

## Executar

```powershell
dotnet run --launch-profile http
```

A API estará disponível em `http://localhost:5027/api/tarefas`. O perfil `http` usa o ambiente `Development`, que carrega User Secrets. Para encerrar, usar `Ctrl+C`.

## Endpoints

| Método e rota | Corpo | Resposta de sucesso |
| --- | --- | --- |
| `GET /api/tarefas` | Sem corpo | `200`, lista ordenada por ID |
| `POST /api/tarefas` | `{"titulo":"Estudar Git"}` | `201`, tarefa criada e pendente |
| `PATCH /api/tarefas/{id}/concluir` | Sem campos obrigatórios | `200`, tarefa concluída |

Uma tarefa contém `id`, `titulo` e `concluida`. Títulos ausentes, vazios ou só com espaços retornam `400`. Concluir um ID inexistente retorna `404`. Repetir a conclusão de uma tarefa mantém seu estado concluído.

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
- `TarefasTests.cs`: verifica o fluxo HTTP e a persistência ao reiniciar o host, usando SQLite temporário isolado.

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
