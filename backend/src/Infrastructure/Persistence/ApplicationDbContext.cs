using Microsoft.EntityFrameworkCore;
using Ruru.Application.Common.Interfaces;
using Ruru.Domain.Entities;

namespace Ruru.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<EmployeeRole> EmployeeRoles => Set<EmployeeRole>();
    public DbSet<InviteToken> InviteTokens => Set<InviteToken>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EmployeeCode).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.EmployeeCode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Name).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<EmployeeRole>(entity =>
        {
            entity.HasKey(er => new { er.EmployeeId, er.RoleId });
        });

        modelBuilder.Entity<InviteToken>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.Token).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.Token).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Sku).IsUnique();
            entity.Property(e => e.Sku).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CostPrice).HasPrecision(18, 2);
            entity.Property(e => e.SellingPrice).HasPrecision(18, 2);
        });

        // Seed Roles
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Admin", Description = "Store Administrator" },
            new Role { Id = 2, Name = "Manager", Description = "Store Manager" },
            new Role { Id = 3, Name = "Therapist", Description = "Beauty Therapist / Beautician" },
            new Role { Id = 4, Name = "Cashier", Description = "Store Cashier" }
        );

        // Seed initial Admin employee with code "EMP-001" and default StoreId
        var defaultStoreId = new Guid("00000000-0000-0000-0000-000000000001");
        var adminId = new Guid("00000000-0000-0000-0000-000000000002");

        modelBuilder.Entity<Employee>().HasData(
            new Employee
            {
                Id = adminId,
                StoreId = defaultStoreId,
                EmployeeCode = "EMP-001",
                FirstName = "System",
                LastName = "Admin",
                Email = "admin@rurupos.com",
                TotpSecret = "NBSWY3DPEB3W64TBNQ", // Base32 for dummy secret "admin12345"
                IsTotpSetUp = true,
                IsActive = true,
                CreatedAt = new DateTime(2026, 7, 11, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 7, 11, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<EmployeeRole>().HasData(
            new EmployeeRole { EmployeeId = adminId, RoleId = 1 }
        );
    }
}
