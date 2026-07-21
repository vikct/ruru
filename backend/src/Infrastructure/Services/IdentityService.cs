using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Ruru.Application.Common.Interfaces;
using Ruru.Domain.Entities;

namespace Ruru.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly IConfiguration _configuration;

    public IdentityService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string AccessToken, string RefreshToken) IssueTokens(Employee employee, List<string> roles)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "super_secret_key_12345_super_secret_key_12345";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "RuruPOS";
        var audience = _configuration["JwtSettings:Audience"] ?? "RuruPOS";
        var expiryMinutesStr = _configuration["JwtSettings:ExpiryMinutes"] ?? "15";
        
        var expiryMinutes = int.TryParse(expiryMinutesStr, out var minutes) ? minutes : 15;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, employee.Id.ToString()),
            new Claim("storeid", employee.StoreId.ToString()),
            new Claim("code", employee.EmployeeCode),
            new Claim(ClaimTypes.Email, employee.Email),
            new Claim("firstname", employee.FirstName),
            new Claim("lastname", employee.LastName)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        // Generate a secure refresh token
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        var refreshToken = Convert.ToBase64String(randomNumber);

        return (accessToken, refreshToken);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "super_secret_key_12345_super_secret_key_12345";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "RuruPOS";
        var audience = _configuration["JwtSettings:Audience"] ?? "RuruPOS";

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateLifetime = false // Here we bypass lifetime validation
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
