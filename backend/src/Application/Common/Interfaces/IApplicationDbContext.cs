using Microsoft.EntityFrameworkCore;
using Ruru.Domain.Entities;

namespace Ruru.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Employee> Employees { get; }
    DbSet<Role> Roles { get; }
    DbSet<EmployeeRole> EmployeeRoles { get; }
    DbSet<InviteToken> InviteTokens { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Product> Products { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
