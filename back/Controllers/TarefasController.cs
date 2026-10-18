using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tarefas.Api.Models;
using Tarefas.Api.Services;

namespace Tarefas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tarefas")]
public class TarefasController(TarefaService service) : ControllerBase
{
    private string UsuarioId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<Tarefa>>> Listar() => Ok(await service.ListarAsync(UsuarioId));

    [HttpPost]
    public async Task<ActionResult<Tarefa>> Criar(CriarTarefaRequest request)
    {
        try
        {
            var tarefa = await service.CriarAsync(UsuarioId, request.Titulo);
            return StatusCode(StatusCodes.Status201Created, tarefa);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { mensagem = exception.Message });
        }
    }

    [HttpPatch("{id:int}/concluir")]
    public async Task<ActionResult<Tarefa>> Concluir(int id)
    {
        var tarefa = await service.ConcluirAsync(UsuarioId, id);
        return tarefa is null
            ? NotFound(new { mensagem = "Tarefa não encontrada." })
            : Ok(tarefa);
    }

    [HttpPatch("{id:int}/reabrir")]
    public async Task<ActionResult<Tarefa>> Reabrir(int id)
    {
        var tarefa = await service.ReabrirAsync(UsuarioId, id);
        return tarefa is null
            ? NotFound(new { mensagem = "Tarefa não encontrada." })
            : Ok(tarefa);
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<Tarefa>> Atualizar(int id, AtualizarTarefaRequest request)
    {
        try
        {
            var tarefa = await service.AtualizarAsync(UsuarioId, id, request.Titulo);
            return tarefa is null
                ? NotFound(new { mensagem = "Tarefa não encontrada." })
                : Ok(tarefa);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { mensagem = exception.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var excluida = await service.ExcluirAsync(UsuarioId, id);
        return excluida ? NoContent() : NotFound(new { mensagem = "Tarefa não encontrada." });
    }
}

public record CriarTarefaRequest(string? Titulo);
public record AtualizarTarefaRequest(string? Titulo);
