using Microsoft.AspNetCore.Identity;

namespace Tarefas.Api.Models;

public class Usuario : IdentityUser
{
    public string Nome { get; set; } = "";
}
