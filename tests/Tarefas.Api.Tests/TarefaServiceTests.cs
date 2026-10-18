using Microsoft.EntityFrameworkCore;
using Tarefas.Api.Persistence;
using Tarefas.Api.Services;
using Xunit;

namespace Tarefas.Api.Tests;

public class TarefaServiceTests
{
    [Theory]
    [Trait("Category", "Unit")]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CriarRejeitaTituloInvalidoAntesDeAcessarOBanco(string? titulo)
    {
        // Sem provedor ou conexão: a validação precisa ocorrer antes da persistência.
        await using var db = new TarefasDbContext(new DbContextOptions<TarefasDbContext>());
        var service = new TarefaService(db);

        var erro = await Assert.ThrowsAsync<ArgumentException>(() => service.CriarAsync("usuario", titulo));

        Assert.Equal("Informe o título da tarefa.", erro.Message);
    }

    [Theory]
    [Trait("Category", "Unit")]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task AtualizarRejeitaTituloInvalidoAntesDeAcessarOBanco(string? titulo)
    {
        await using var db = new TarefasDbContext(new DbContextOptions<TarefasDbContext>());
        var service = new TarefaService(db);

        var erro = await Assert.ThrowsAsync<ArgumentException>(() => service.AtualizarAsync("usuario", 1, titulo));

        Assert.Equal("Informe o título da tarefa.", erro.Message);
    }
}
