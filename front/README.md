# Frontend — Tarefas de estudo

Interface Angular com cadastro/login e quadro de tarefas por conta, incluindo cadastro, conclusão, edição e exclusão de tarefas. Consulte o [README principal](../README.md) para conhecer a arquitetura da aplicação.

## Pré-requisitos

- Node.js 24, ou Node.js 22 a partir de 22.12.
- npm.
- API em execução para utilizar as funcionalidades da interface. Consulte a [configuração do backend](../back/README.md).

Não é necessário instalar o Angular CLI globalmente. Os comandos usam a versão definida no projeto.

## Instalar e executar

Na pasta `front`:

```powershell
npm ci
npm start
```

Acessar [http://localhost:4200](http://localhost:4200). Para encerrar o servidor, usar `Ctrl+C`.

## Conexão com a API

O token `API_BASE_URL`, em `src/app/auth.service.ts`, define o endereço base da API e, por padrão, usa `http://localhost:5027`. O serviço de tarefas acrescenta `/api/tarefas`; o serviço de acesso usa os endpoints de cadastro, login e perfil.

A API permite requisições da origem `http://localhost:4200`. Usar esse endereço no navegador, pois `127.0.0.1` representa outra origem para a configuração de CORS.

## Testes

```powershell
npm test
```

Os testes usam Vitest e jsdom, executam uma única rodada e terminam automaticamente. Uma falha resulta em código de saída diferente de zero. Não exigem navegador instalado, API em execução ou banco de dados.

- `src/app/app.spec.ts`: acesso à tela protegida, lista vazia, validação de título, cadastro, conclusão e mensagens de falha.
- `src/app/tarefas.service.spec.ts`: requisições GET, POST, PATCH e DELETE e suas respostas, usando HTTP simulado.
- `src/app/auth.service.spec.ts`: cadastro, login, persistência do token de sessão e recuperação do perfil.

## Build

```powershell
npm run build
```

Os arquivos gerados ficam em `dist/front/browser`.

## Problemas comuns

| Sintoma | Verificação |
| --- | --- |
| Falha ao carregar a lista | Confirmar se a API está disponível na porta 5027 e se o banco está configurado |
| Erro de CORS | Abrir a interface por `http://localhost:4200` |
| Versão de Node incompatível | Conferir `node --version` e usar uma versão dos pré-requisitos |
| Porta 4200 ocupada | Encerrar a outra instância antes de iniciar o servidor |
