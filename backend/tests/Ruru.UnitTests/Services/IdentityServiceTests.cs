using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Ruru.Domain.Entities;
using Ruru.Infrastructure.Services;
using Xunit;

namespace Ruru.UnitTests.Services;

public class IdentityServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly IdentityService _identityService;

    public IdentityServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string?> {
            {"JwtSettings:Secret", "super_secret_key_12345_super_secret_key_12345"},
            {"JwtSettings:Issuer", "RuruPOS"},
            {"JwtSettings:Audience", "RuruPOS"},
            {"JwtSettings:ExpiryMinutes", "15"},
            {"JwtSettings:RefreshExpiryDays", "7"}
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _identityService = new IdentityService(_configuration);
    }

    [Fact]
    public void IssueTokens_ShouldGenerateTokensWithCorrectClaims()
    {
        // Arrange
        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            StoreId = Guid.NewGuid(),
            EmployeeCode = "EMP-999",
            FirstName = "Test",
            LastName = "Employee",
            Email = "test@rurupos.com"
        };
        var roles = new List<string> { "Manager", "Therapist" };

        // Act
        var (accessToken, refreshToken) = _identityService.IssueTokens(employee, roles);

        // Assert
        Assert.NotNull(accessToken);
        Assert.NotEmpty(accessToken);
        Assert.NotNull(refreshToken);
        Assert.NotEmpty(refreshToken);

        // Parse token to check claims
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(accessToken);

        Assert.Equal("RuruPOS", jwtToken.Issuer);
        Assert.Contains("RuruPOS", jwtToken.Audiences);

        var claims = jwtToken.Claims.ToList();

        var subClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        Assert.Equal(employee.Id.ToString(), subClaim);

        var storeIdClaim = claims.FirstOrDefault(c => c.Type == "storeid")?.Value;
        Assert.Equal(employee.StoreId.ToString(), storeIdClaim);

        var codeClaim = claims.FirstOrDefault(c => c.Type == "code")?.Value;
        Assert.Equal(employee.EmployeeCode, codeClaim);

        var emailClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        Assert.Equal(employee.Email, emailClaim);

        var roleClaims = claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
        Assert.Contains("Manager", roleClaims);
        Assert.Contains("Therapist", roleClaims);
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_WithValidToken_ShouldReturnClaimsPrincipal()
    {
        // Arrange
        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            StoreId = Guid.NewGuid(),
            EmployeeCode = "EMP-999",
            FirstName = "Test",
            LastName = "Employee",
            Email = "test@rurupos.com"
        };
        var roles = new List<string> { "Admin" };
        var (accessToken, _) = _identityService.IssueTokens(employee, roles);

        // Act
        var principal = _identityService.GetPrincipalFromExpiredToken(accessToken);

        // Assert
        Assert.NotNull(principal);
        var subClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Assert.Equal(employee.Id.ToString(), subClaim);

        var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value;
        Assert.Equal("Admin", roleClaim);
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var invalidToken = "invalid.jwt.token";

        // Act
        var principal = _identityService.GetPrincipalFromExpiredToken(invalidToken);

        // Assert
        Assert.Null(principal);
    }
}
