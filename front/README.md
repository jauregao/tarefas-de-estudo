# Frontend — Tarefas de estudo

Interface Angular para cadastrar, listar e concluir tarefas. Consulte o [README principal](../README.md) para conhecer a arquitetura da aplicação.

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

O token `API_URL`, em `src/app/tarefas.service.ts`, define o endereço `http://localhost:5027/api/tarefas`.

A API permite requisições da origem `http://localhost:4200`. Usar esse endereço no navegador, pois `127.0.0.1` representa outra origem para a configuração de CORS.

## Testes

```powershell
npm test
```

Os testes usam Vitest e jsdom, executam uma única rodada e terminam automaticamente. Uma falha resulta em código de saída diferente de zero. Não exigem navegador instalado, API em execução ou banco de dados.

- `src/app/app.spec.ts`: lista vazia, validação de título, cadastro, conclusão e mensagens de falha.
- `src/app/tarefas.service.spec.ts`: requisições GET, POST e PATCH e suas respostas, usando HTTP simulado.

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
