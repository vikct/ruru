using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ruru.Application.Common.Interfaces;
using Ruru.Infrastructure.Persistence;
using Ruru.Infrastructure.Services;

namespace Ruru.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=ruru.db";

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            if (connectionString.Contains("Host=") || connectionString.Contains("Server=") || connectionString.Contains("Port="))
            {
                options.UseNpgsql(connectionString);
            }
            else
            {
                options.UseSqlite(connectionString);
            }
        });

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        services.AddSingleton<ITotpService, TotpService>();

        return services;
    }
}
