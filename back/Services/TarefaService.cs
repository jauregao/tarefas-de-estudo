using Microsoft.EntityFrameworkCore;
using Tarefas.Api.Persistence;
using Tarefas.Api.Models;

namespace Tarefas.Api.Services;

public class TarefaService(TarefasDbContext db)
{
    public Task<List<Tarefa>> ListarAsync() =>
        db.Tarefas.AsNoTracking().OrderBy(tarefa => tarefa.Id).ToListAsync();

    public async Task<Tarefa> CriarAsync(string? titulo)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            throw new ArgumentException("Informe o título da tarefa.");

        var tarefa = new Tarefa { Titulo = titulo.Trim(), Concluida = false };
        db.Tarefas.Add(tarefa);
        await db.SaveChangesAsync();
        return tarefa;
    }

    public async Task<Tarefa?> ConcluirAsync(int id)
    {
        var tarefa = await db.Tarefas.FindAsync(id);
        if (tarefa is null) return null;
        tarefa.Concluida = true;
        await db.SaveChangesAsync();
        return tarefa;
    }
}
