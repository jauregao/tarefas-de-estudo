using Microsoft.EntityFrameworkCore;
using Tarefas.Api.Persistence;
using Tarefas.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<TarefaService>();

builder.Services.AddDbContext<TarefasDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Tarefas");
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException(
            "Configure ConnectionStrings:Tarefas com a conexão PostgreSQL. Consulte o README para usar .NET User Secrets.");
    options.UseNpgsql(connectionString);
});

builder.Services.AddCors(options => options.AddPolicy("AngularLocal", policy =>
    policy.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseExceptionHandler();
app.UseCors("AngularLocal");
app.MapControllers();

app.Run();

// Permite testes HTTP em memória com WebApplicationFactory.
public partial class Program { }
