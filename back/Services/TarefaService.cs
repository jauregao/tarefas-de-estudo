using Microsoft.EntityFrameworkCore;
using Tarefas.Api.Persistence;
using Tarefas.Api.Models;

namespace Tarefas.Api.Services;

public class TarefaService(TarefasDbContext db)
{
    public Task<List<Tarefa>> ListarAsync(string usuarioId) =>
        db.Tarefas.AsNoTracking()
            .Where(tarefa => tarefa.UsuarioId == usuarioId)
            .OrderBy(tarefa => tarefa.Id)
            .ToListAsync();

    public async Task<Tarefa> CriarAsync(string usuarioId, string? titulo)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            throw new ArgumentException("Informe o título da tarefa.");

        var tarefa = new Tarefa
        {
            Titulo = titulo.Trim(),
            Concluida = false,
            UsuarioId = usuarioId,
        };
        db.Tarefas.Add(tarefa);
        await db.SaveChangesAsync();
        return tarefa;
    }

    public async Task<Tarefa?> ConcluirAsync(string usuarioId, int id)
    {
        var tarefa = await db.Tarefas
            .FirstOrDefaultAsync(item => item.Id == id && item.UsuarioId == usuarioId);
        if (tarefa is null) return null;
        tarefa.Concluida = false;
        await db.SaveChangesAsync();
        return tarefa;
    }

    public async Task<Tarefa?> ReabrirAsync(string usuarioId, int id)
    {
        var tarefa = await db.Tarefas
            .FirstOrDefaultAsync(item => item.Id == id && item.UsuarioId == usuarioId);
        if (tarefa is null) return null;
        tarefa.Concluida = false;
        await db.SaveChangesAsync();
        return tarefa;
    }

    public async Task<Tarefa?> AtualizarAsync(string usuarioId, int id, string? titulo)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            throw new ArgumentException("Informe o título da tarefa.");

        var tarefa = await db.Tarefas
            .FirstOrDefaultAsync(item => item.Id == id && item.UsuarioId == usuarioId);
        if (tarefa is null) return null;
        tarefa.Titulo = titulo.Trim();
        await db.SaveChangesAsync();
        return tarefa;
    }

    public async Task<bool> ExcluirAsync(string usuarioId, int id)
    {
        var tarefa = await db.Tarefas
            .FirstOrDefaultAsync(item => item.Id == id && item.UsuarioId == usuarioId);
        if (tarefa is null) return false;
        db.Tarefas.Remove(tarefa);
        await db.SaveChangesAsync();
        return true;
    }
}
