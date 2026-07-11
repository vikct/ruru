using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OtpNet;
using Ruru.Infrastructure.Persistence;
using Ruru.WebApi.Endpoints;
using Xunit;

namespace Ruru.UnitTests.Endpoints;

public class TestAuthFactory : WebApplicationFactory<Program>
{
    private SqliteConnection? _connection;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        builder.ConfigureServices(services =>
        {
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (dbContextDescriptor != null)
            {
                services.Remove(dbContextDescriptor);
            }

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseSqlite(_connection);
            });

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated(); // Creates schema and seeds roles & admin user NBSWY3DPEB3W64TBNQ
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection?.Close();
            _connection?.Dispose();
        }
    }
}

public class AuthEndpointsTests : IClassFixture<TestAuthFactory>
{
    private readonly TestAuthFactory _factory;
    private readonly HttpClient _client;

    public AuthEndpointsTests(TestAuthFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnOk()
    {
        // Arrange
        // EMP-001 is seeded with secret: NBSWY3DPEB3W64TBNQ
        var secret = "NBSWY3DPEB3W64TBNQ";
        var key = Base32Encoding.ToBytes(secret);
        var totp = new Totp(key);
        var validCode = totp.ComputeTotp();

        var request = new LoginRequest("EMP-001", validCode);

        // Act
        var response = await _client.PostAsJsonAsync("api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(result);
        Assert.NotNull(result.AccessToken);
        Assert.NotNull(result.RefreshToken);
        Assert.Equal("EMP-001", result.Employee.EmployeeCode);
        Assert.Contains("Admin", result.Employee.Roles);
    }

    [Fact]
    public async Task Login_WithInvalidTotp_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new LoginRequest("EMP-001", "000000");

        // Act
        var response = await _client.PostAsJsonAsync("api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithNonExistentEmployee_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new LoginRequest("EMP-NONEXISTENT", "123456");

        // Act
        var response = await _client.PostAsJsonAsync("api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
