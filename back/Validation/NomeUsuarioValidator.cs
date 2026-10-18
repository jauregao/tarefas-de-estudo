using Microsoft.AspNetCore.Identity;
using Tarefas.Api.Models;

namespace Tarefas.Api.Validation;

public sealed class NomeUsuarioValidator : IUserValidator<Usuario>
{
    public Task<IdentityResult> ValidateAsync(UserManager<Usuario> manager, Usuario usuario)
    {
        var nome = usuario.Nome?.Trim();
        return Task.FromResult(string.IsNullOrWhiteSpace(nome) || nome.Length > 100
            ? IdentityResult.Failed(new IdentityError
            {
                Code = "InvalidName",
                Description = "Informe um nome com até 100 caracteres.",
            })
            : IdentityResult.Success);
    }
}
