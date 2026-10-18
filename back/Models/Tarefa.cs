using System.Text.Json.Serialization;

namespace Tarefas.Api.Models;

public class Tarefa
{
    public int Id { get; set; }
    public string Titulo { get; set; } = "";
    public bool Concluida { get; set; }
    [JsonIgnore]
    public string? UsuarioId { get; set; }
}
