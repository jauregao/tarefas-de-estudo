using Microsoft.AspNetCore.Mvc;
using Tarefas.Api.Models;
using Tarefas.Api.Services;

namespace Tarefas.Api.Controllers;

[ApiController]
[Route("api/tarefas")]
public class TarefasController(TarefaService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Tarefa>>> Listar() => Ok(await service.ListarAsync());

    [HttpPost]
    public async Task<ActionResult<Tarefa>> Criar(CriarTarefaRequest request)
    {
        try
        {
            var tarefa = await service.CriarAsync(request.Titulo);
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
        var tarefa = await service.ConcluirAsync(id);
        return tarefa is null
            ? NotFound(new { mensagem = "Tarefa não encontrada." })
            : Ok(tarefa);
    }
}

public record CriarTarefaRequest(string? Titulo);
