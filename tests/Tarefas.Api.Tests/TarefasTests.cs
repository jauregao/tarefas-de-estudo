using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Tarefas.Api.Persistence;
using Xunit;

namespace Tarefas.Api.Tests;

public class TarefasTests
{
    [Fact]
    [Trait("Category", "Integration")]
    public async Task ApiCriaListaConcluiEPersisteAoReiniciar()
    {
        var path = Path.Combine(Path.GetTempPath(), $"tarefas-test-{Guid.NewGuid():N}.db");
        var connection = $"Data Source={path};Pooling=False";
        try
        {
            using (var app = new TestApp(connection))
            using (var client = app.CreateClient())
            {
                Assert.Empty((await client.GetFromJsonAsync<List<TarefaResposta>>("/api/tarefas"))!);
                var created = await client.PostAsJsonAsync("/api/tarefas", new { titulo = "  Estudar cloud  " });
                Assert.Equal(HttpStatusCode.Created, created.StatusCode);
                var tarefa = (await created.Content.ReadFromJsonAsync<TarefaResposta>())!;
                Assert.Equal("Estudar cloud", tarefa.Titulo);
                Assert.False(tarefa.Concluida);

                var concluded = await client.PatchAsync($"/api/tarefas/{tarefa.Id}/concluir", null);
                Assert.Equal(HttpStatusCode.OK, concluded.StatusCode);
                Assert.True((await concluded.Content.ReadFromJsonAsync<TarefaResposta>())!.Concluida);
                Assert.Equal(HttpStatusCode.OK,
                    (await client.PatchAsync($"/api/tarefas/{tarefa.Id}/concluir", null)).StatusCode);
                Assert.Single((await client.GetFromJsonAsync<List<TarefaResposta>>("/api/tarefas"))!);
                Assert.Equal(HttpStatusCode.NotFound,
                    (await client.PatchAsync("/api/tarefas/99999/concluir", null)).StatusCode);
                Assert.Equal(HttpStatusCode.BadRequest,
                    (await client.PostAsJsonAsync("/api/tarefas", new { titulo = " " })).StatusCode);
            }

            // Novo host, mesmo arquivo: a persistência não depende da memória do processo.
            using var restarted = new TestApp(connection);
            using var secondClient = restarted.CreateClient();
            var saved = Assert.Single((await secondClient.GetFromJsonAsync<List<TarefaResposta>>("/api/tarefas"))!);
            Assert.Equal("Estudar cloud", saved.Titulo);
            Assert.True(saved.Concluida);
        }
        finally
        {
            File.Delete(path);
        }
    }

    private sealed class TestApp(string connection) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder) =>
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<TarefasDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<TarefasDbContext>>();
                services.AddDbContext<TarefasDbContext>(options => options.UseSqlite(connection));
            });

        protected override IHost CreateHost(IHostBuilder builder)
        {
            var host = base.CreateHost(builder);
            using var scope = host.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<TarefasDbContext>().Database.EnsureCreated();
            return host;
        }
    }

    private record TarefaResposta(int Id, string Titulo, bool Concluida);
}
