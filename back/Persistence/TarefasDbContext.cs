using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Tarefas.Api.Models;

namespace Tarefas.Api.Persistence;

public class TarefasDbContext(DbContextOptions<TarefasDbContext> options)
    : IdentityDbContext<Usuario>(options), IDataProtectionKeyContext
{
    public DbSet<Tarefa> Tarefas => Set<Tarefa>();
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<Tarefa>()
            .HasOne<Usuario>()
            .WithMany()
            .HasForeignKey(tarefa => tarefa.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
