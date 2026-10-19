using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Tarefas.Api.Persistence;
using Xunit;

namespace Tarefas.Api.Tests;

public class TarefasTests
{
    private const string Senha = "SenhaForte123!";

    [Fact]
    [Trait("Category", "Integration")]
    public async Task TarefasExigemLoginESaoIsoladasPorUsuario()
    {
        var path = Path.Combine(Path.GetTempPath(), $"tarefas-test-{Guid.NewGuid():N}.db");
        var connection = $"Data Source={path};Pooling=False";
        try
        {
            using var app = new TestApp(connection);
            using var anonimo = app.CreateClient();
            Assert.Equal(HttpStatusCode.Unauthorized,
                (await anonimo.GetAsync("/api/tarefas")).StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized,
                (await anonimo.GetAsync("/api/auth/me")).StatusCode);

            var tokenAlice = await RegistrarEEntrar(anonimo, "Alice", "alice@example.test");
            using var clienteAlice = app.CreateClient();
            clienteAlice.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenAlice);
            var perfil = await clienteAlice.GetFromJsonAsync<UsuarioResposta>("/api/auth/me");
            Assert.Equal("Alice", perfil!.Nome);

            var tarefaAlice = await CriarTarefa(clienteAlice, "Estudar Git");
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<TarefasDbContext>();
                Assert.Equal(perfil.Id, (await db.Tarefas.SingleAsync()).UsuarioId);
            }

            using var clienteBob = app.CreateClient();
            var tokenBob = await RegistrarEEntrar(clienteBob, "Bob", "bob@example.test");
            clienteBob.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenBob);
            var tarefaBob = await CriarTarefa(clienteBob, "Revisar Angular");

            Assert.Equal([tarefaAlice.Id],
                (await clienteAlice.GetFromJsonAsync<List<TarefaResposta>>("/api/tarefas"))!
                    .Select(tarefa => tarefa.Id));
            Assert.Equal([tarefaBob.Id],
                (await clienteBob.GetFromJsonAsync<List<TarefaResposta>>("/api/tarefas"))!
                    .Select(tarefa => tarefa.Id));
            Assert.Equal(HttpStatusCode.NotFound,
                (await clienteAlice.PatchAsync($"/api/tarefas/{tarefaBob.Id}/concluir", null)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound,
                (await clienteAlice.PatchAsJsonAsync($"/api/tarefas/{tarefaBob.Id}", new { titulo = "Invadir" })).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound,
                (await clienteAlice.DeleteAsync($"/api/tarefas/{tarefaBob.Id}")).StatusCode);
            var atualizada = await clienteAlice.PatchAsJsonAsync($"/api/tarefas/{tarefaAlice.Id}", new { titulo = "  Estudar CI/CD  " });
            Assert.Equal(HttpStatusCode.OK, atualizada.StatusCode);
            Assert.Equal("Estudar CI/CD", (await atualizada.Content.ReadFromJsonAsync<TarefaResposta>())!.Titulo);
            var concluida = await clienteAlice.PatchAsync($"/api/tarefas/{tarefaAlice.Id}/concluir", null);
            Assert.Equal(HttpStatusCode.OK, concluida.StatusCode);
            Assert.True((await concluida.Content.ReadFromJsonAsync<TarefaResposta>())!.Concluida);
            var reaberta = await clienteAlice.PatchAsync($"/api/tarefas/{tarefaAlice.Id}/reabrir", null);
            Assert.Equal(HttpStatusCode.OK, reaberta.StatusCode);
            Assert.False((await reaberta.Content.ReadFromJsonAsync<TarefaResposta>())!.Concluida);
            Assert.Equal(HttpStatusCode.NoContent,
                (await clienteAlice.DeleteAsync($"/api/tarefas/{tarefaAlice.Id}")).StatusCode);
            Assert.Empty(await clienteAlice.GetFromJsonAsync<List<TarefaResposta>>("/api/tarefas") ?? []);
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task SenhaNaoEArmazenadaEmTextoPuroEUsuarioConsegueEntrar()
    {
        var path = Path.Combine(Path.GetTempPath(), $"tarefas-auth-{Guid.NewGuid():N}.db");
        var connection = $"Data Source={path};Pooling=False";
        try
        {
            using var app = new TestApp(connection);
            using var client = app.CreateClient();
            var registro = await client.PostAsJsonAsync("/api/auth/register", new
            {
                nome = "Carla",
                email = "carla@example.test",
                senha = Senha,
            });
            Assert.Equal(HttpStatusCode.Created, registro.StatusCode);

            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TarefasDbContext>();
            var usuario = await db.Users.SingleAsync(user => user.Email == "carla@example.test");
            Assert.NotEqual(Senha, usuario.PasswordHash);
            Assert.NotNull(usuario.PasswordHash);

            var login = await Entrar(client, "carla@example.test");
            Assert.False(string.IsNullOrWhiteSpace(login));
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task TarefaDoUsuarioPersisteDepoisDeReiniciarAApi()
    {
        var path = Path.Combine(Path.GetTempPath(), $"tarefas-restart-{Guid.NewGuid():N}.db");
        var connection = $"Data Source={path};Pooling=False";
        try
        {
            using (var app = new TestApp(connection))
            using (var client = app.CreateClient())
            {
                var token = await RegistrarEEntrar(client, "Dani", "dani@example.test");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                await CriarTarefa(client, "Persistir por pessoa");
            }

            using var reiniciada = new TestApp(connection);
            using var clienteNovo = reiniciada.CreateClient();
            var contaNova = await Entrar(clienteNovo, "dani@example.test");
            clienteNovo.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", contaNova);
            var tarefasSalvas = await clienteNovo.GetFromJsonAsync<List<TarefaResposta>>("/api/tarefas");
            Assert.NotNull(tarefasSalvas);
            var salva = Assert.Single(tarefasSalvas);
            Assert.Equal("Persistir por pessoa", salva.Titulo);
            using var scope = reiniciada.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TarefasDbContext>();
            Assert.Equal("Dani", (await db.Users.SingleAsync(user => user.Email == "dani@example.test")).Nome);
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task CadastroAceitaSenhaComQuatroCaracteresERejeitaSenhaMaisCurtaENomeAusente()
    {
        using var app = new TestApp($"Data Source={Path.Combine(Path.GetTempPath(), $"tarefas-{Guid.NewGuid():N}.db")};Pooling=False");
        using var client = app.CreateClient();
        var senhaFraca = await client.PostAsJsonAsync("/api/auth/register", new
        {
            nome = "Eva", email = "eva@example.test", senha = "abc",
        });
        Assert.Equal(HttpStatusCode.BadRequest, senhaFraca.StatusCode);

        var senhaValida = await client.PostAsJsonAsync("/api/auth/register", new
        {
            nome = "Eva", email = "eva@example.test", senha = "abcd",
        });
        Assert.Equal(HttpStatusCode.Created, senhaValida.StatusCode);

        var semNome = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "semnome@example.test", password = Senha,
        });
        Assert.Equal(HttpStatusCode.BadRequest, semNome.StatusCode);
    }

    private static async Task<string> RegistrarEEntrar(HttpClient client, string nome, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new { nome, email, senha = Senha });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await Entrar(client, email);
    }

    private static async Task<string> Entrar(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/identity/login?useCookies=false", new
        {
            email, password = Senha,
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = await response.Content.ReadFromJsonAsync<TokenResposta>();
        return token!.AccessToken;
    }

    private static async Task<TarefaResposta> CriarTarefa(HttpClient client, string titulo)
    {
        var response = await client.PostAsJsonAsync("/api/tarefas", new { titulo });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TarefaResposta>())!;
    }

    private sealed class TestApp(string connection) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration(configuration => configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Tarefas"] = "Host=localhost;Database=teste;Username=teste;Password=teste",
                }));
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<TarefasDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<TarefasDbContext>>();
                services.AddDbContext<TarefasDbContext>(options => options.UseSqlite(connection));
            });
        }

        protected override IHost CreateHost(IHostBuilder builder)
        {
            var host = base.CreateHost(builder);
            using var scope = host.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<TarefasDbContext>().Database.EnsureCreated();
            return host;
        }
    }

    private record TokenResposta(string TokenType, string AccessToken, int ExpiresIn, string RefreshToken);
    private record TarefaResposta(int Id, string Titulo, bool Concluida);
    private record UsuarioResposta(string Id, string Nome, string Email);
}
