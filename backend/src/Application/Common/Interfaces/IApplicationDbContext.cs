using Microsoft.EntityFrameworkCore;
using Ruru.Domain.Entities;

namespace Ruru.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Product> Products { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
