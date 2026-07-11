using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Ruru.Application.Common.Interfaces;
using Ruru.Domain.Entities;

namespace Ruru.WebApi.Endpoints;

public class AuthEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/auth");

        group.MapPost("login", async (
            [FromBody] LoginRequest request,
            IApplicationDbContext dbContext,
            ITotpService totpService,
            IIdentityService identityService,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.EmployeeCode) || string.IsNullOrWhiteSpace(request.Code))
            {
                return Results.BadRequest("Employee code and TOTP code are required.");
            }

            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.EmployeeCode == request.EmployeeCode && e.IsActive, cancellationToken);

            if (employee == null)
            {
                return Results.Unauthorized();
            }

            // Verify TOTP code
            var isValid = totpService.VerifyCode(employee.TotpSecret, request.Code);
            if (!isValid)
            {
                return Results.Unauthorized();
            }

            // Get employee roles
            var roleIds = await dbContext.EmployeeRoles
                .Where(er => er.EmployeeId == employee.Id)
                .Select(er => er.RoleId)
                .ToListAsync(cancellationToken);

            var roles = await dbContext.Roles
                .Where(r => roleIds.Contains(r.Id))
                .Select(r => r.Name)
                .ToListAsync(cancellationToken);

            var (accessToken, refreshToken) = identityService.IssueTokens(employee, roles);

            // Save refresh token
            var tokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                EmployeeId = employee.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                DeviceInfo = "Counter Device",
                CreatedAt = DateTime.UtcNow
            };

            dbContext.RefreshTokens.Add(tokenEntity);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new LoginResponse(
                accessToken,
                refreshToken,
                new EmployeeDto(employee.Id, employee.FirstName, employee.LastName, employee.EmployeeCode, roles)
            ));
        });

        group.MapPost("refresh", async (
            [FromBody] RefreshRequest request,
            IApplicationDbContext dbContext,
            IIdentityService identityService,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return Results.BadRequest("Access token and Refresh token are required.");
            }

            var principal = identityService.GetPrincipalFromExpiredToken(request.AccessToken);
            if (principal == null)
            {
                return Results.BadRequest("Invalid access token.");
            }

            var employeeIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(employeeIdClaim, out var employeeId))
            {
                return Results.BadRequest("Invalid claims in access token.");
            }

            var storedRefreshToken = await dbContext.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && t.EmployeeId == employeeId && t.RevokedAt == null, cancellationToken);

            if (storedRefreshToken == null || storedRefreshToken.ExpiresAt < DateTime.UtcNow)
            {
                return Results.Unauthorized();
            }

            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.IsActive, cancellationToken);

            if (employee == null)
            {
                return Results.Unauthorized();
            }

            // Get employee roles
            var roleIds = await dbContext.EmployeeRoles
                .Where(er => er.EmployeeId == employee.Id)
                .Select(er => er.RoleId)
                .ToListAsync(cancellationToken);

            var roles = await dbContext.Roles
                .Where(r => roleIds.Contains(r.Id))
                .Select(r => r.Name)
                .ToListAsync(cancellationToken);

            // Rotate Refresh Token
            storedRefreshToken.RevokedAt = DateTime.UtcNow;

            var (newAccessToken, newRefreshToken) = identityService.IssueTokens(employee, roles);

            var tokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                EmployeeId = employee.Id,
                Token = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                DeviceInfo = "Counter Device (Rotated)",
                CreatedAt = DateTime.UtcNow
            };

            dbContext.RefreshTokens.Add(tokenEntity);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new LoginResponse(
                newAccessToken,
                newRefreshToken,
                new EmployeeDto(employee.Id, employee.FirstName, employee.LastName, employee.EmployeeCode, roles)
            ));
        });

        group.MapPost("logout", async (
            [FromBody] LogoutRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return Results.BadRequest("Refresh token is required.");
            }

            var storedRefreshToken = await dbContext.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && t.RevokedAt == null, cancellationToken);

            if (storedRefreshToken != null)
            {
                storedRefreshToken.RevokedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            return Results.NoContent();
        });
    }
}

public record LoginRequest(string EmployeeCode, string Code);
public record RefreshRequest(string AccessToken, string RefreshToken);
public record LogoutRequest(string RefreshToken);
public record EmployeeDto(Guid Id, string FirstName, string LastName, string EmployeeCode, List<string> Roles);
public record LoginResponse(string AccessToken, string RefreshToken, EmployeeDto Employee);
