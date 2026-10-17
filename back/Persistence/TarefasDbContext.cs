using Microsoft.EntityFrameworkCore;
using Tarefas.Api.Models;

namespace Tarefas.Api.Persistence;

public class TarefasDbContext(DbContextOptions<TarefasDbContext> options) : DbContext(options)
{
    public DbSet<Tarefa> Tarefas => Set<Tarefa>();
}
