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

public class EmployeeEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/employees").RequireAuthorization();

        // GET /api/employees - Admin only
        group.MapGet("", async (
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var employees = await dbContext.Employees
                .Select(e => new EmployeeListDto(
                    e.Id,
                    e.EmployeeCode,
                    e.FirstName,
                    e.LastName,
                    e.Email,
                    e.Phone,
                    e.IsActive,
                    e.IsTotpSetUp
                ))
                .ToListAsync(cancellationToken);

            return Results.Ok(employees);
        }).RequireAuthorization("AdminOnly");

        // GET /api/employees/{id} - Admin or Self
        group.MapGet("{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = user.IsInRole("Admin");

            if (userIdClaim != id.ToString() && !isAdmin)
            {
                return Results.Forbid();
            }

            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return Results.NotFound();
            }

            var roleIds = await dbContext.EmployeeRoles
                .Where(er => er.EmployeeId == employee.Id)
                .Select(er => er.RoleId)
                .ToListAsync(cancellationToken);

            var roles = await dbContext.Roles
                .Where(r => roleIds.Contains(r.Id))
                .Select(r => r.Name)
                .ToListAsync(cancellationToken);

            return Results.Ok(new EmployeeDetailsDto(
                employee.Id,
                employee.StoreId,
                employee.EmployeeCode,
                employee.FirstName,
                employee.LastName,
                employee.Email,
                employee.Phone,
                employee.IsActive,
                employee.IsTotpSetUp,
                roles
            ));
        });

        // POST /api/employees - Admin only
        group.MapPost("", async (
            [FromBody] CreateEmployeeRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.EmployeeCode) || 
                string.IsNullOrWhiteSpace(request.FirstName) || 
                string.IsNullOrWhiteSpace(request.LastName) || 
                string.IsNullOrWhiteSpace(request.Email))
            {
                return Results.BadRequest("EmployeeCode, FirstName, LastName, and Email are required.");
            }

            var exists = await dbContext.Employees
                .AnyAsync(e => e.EmployeeCode == request.EmployeeCode || e.Email == request.Email, cancellationToken);

            if (exists)
            {
                return Results.Conflict("Employee code or email already registered.");
            }

            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                StoreId = request.StoreId,
                EmployeeCode = request.EmployeeCode,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                TotpSecret = string.Empty, // Will be generated on setup
                IsTotpSetUp = false,
                IsActive = true
            };

            dbContext.Employees.Add(employee);

            // Add roles
            if (request.RoleIds != null && request.RoleIds.Any())
            {
                foreach (var roleId in request.RoleIds)
                {
                    dbContext.EmployeeRoles.Add(new EmployeeRole
                    {
                        EmployeeId = employee.Id,
                        RoleId = roleId
                    });
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/employees/{employee.Id}", employee.Id);
        }).RequireAuthorization("AdminOnly");

        // PUT /api/employees/{id} - Admin only
        group.MapPut("{id:guid}", async (
            Guid id,
            [FromBody] UpdateEmployeeRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return Results.NotFound();
            }

            employee.FirstName = request.FirstName;
            employee.LastName = request.LastName;
            employee.Email = request.Email;
            employee.Phone = request.Phone;
            employee.UpdatedAt = DateTime.UtcNow;

            // Update roles: remove old ones and add new ones
            var existingRoles = await dbContext.EmployeeRoles
                .Where(er => er.EmployeeId == id)
                .ToListAsync(cancellationToken);

            dbContext.EmployeeRoles.RemoveRange(existingRoles);

            if (request.RoleIds != null && request.RoleIds.Any())
            {
                foreach (var roleId in request.RoleIds)
                {
                    dbContext.EmployeeRoles.Add(new EmployeeRole
                    {
                        EmployeeId = employee.Id,
                        RoleId = roleId
                    });
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).RequireAuthorization("AdminOnly");

        // PATCH /api/employees/{id}/status - Admin only
        group.MapPatch("{id:guid}/status", async (
            Guid id,
            [FromBody] UpdateEmployeeStatusRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return Results.NotFound();
            }

            employee.IsActive = request.IsActive;
            employee.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).RequireAuthorization("AdminOnly");

        // POST /api/employees/{id}/totp-setup - Admin only (generates secret and QR code URI)
        group.MapPost("{id:guid}/totp-setup", async (
            Guid id,
            IApplicationDbContext dbContext,
            ITotpService totpService,
            CancellationToken cancellationToken) =>
        {
            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return Results.NotFound();
            }

            var secret = totpService.GenerateSecret();
            employee.TotpSecret = secret;
            employee.IsTotpSetUp = false;

            await dbContext.SaveChangesAsync(cancellationToken);

            var qrUri = totpService.GetQrCodeUri(employee.Email, secret);

            return Results.Ok(new TotpSetupResponse(secret, qrUri));
        }).RequireAuthorization("AdminOnly");

        // POST /api/employees/{id}/totp-verify - Anonymous/Bearer (verify and activate TOTP)
        group.MapPost("{id:guid}/totp-verify", async (
            Guid id,
            [FromBody] VerifyTotpRequest request,
            IApplicationDbContext dbContext,
            ITotpService totpService,
            CancellationToken cancellationToken) =>
        {
            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return Results.NotFound();
            }

            if (string.IsNullOrEmpty(employee.TotpSecret))
            {
                return Results.BadRequest("TOTP setup has not been initialized for this employee.");
            }

            var isValid = totpService.VerifyCode(employee.TotpSecret, request.Code);
            if (!isValid)
            {
                return Results.BadRequest("Invalid TOTP code.");
            }

            employee.IsTotpSetUp = true;
            employee.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).AllowAnonymous();

        // POST /api/employees/{id}/invite - Admin only
        group.MapPost("{id:guid}/invite", async (
            Guid id,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == id && e.IsActive, cancellationToken);

            if (employee == null)
            {
                return Results.NotFound();
            }

            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("/", "-").Replace("+", "_").TrimEnd('=');

            var inviteToken = new InviteToken
            {
                Id = Guid.NewGuid(),
                EmployeeId = employee.Id,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                IsUsed = false
            };

            dbContext.InviteTokens.Add(inviteToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            var inviteLink = $"http://localhost:4200/invite/{token}";
            
            // Console log the invite link for development
            Console.WriteLine($"[INVITE SENT] Email to: {employee.Email}. Link: {inviteLink}");

            return Results.Ok(new InviteResponse(inviteLink));
        }).RequireAuthorization("AdminOnly");

        // GET /api/invite/{token} - Allow Anonymous
        app.MapGet("api/invite/{token}", async (
            string token,
            IApplicationDbContext dbContext,
            ITotpService totpService,
            CancellationToken cancellationToken) =>
        {
            var invite = await dbContext.InviteTokens
                .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow, cancellationToken);

            if (invite == null)
            {
                return Results.NotFound("Invite link is invalid or expired.");
            }

            var employee = await dbContext.Employees
                .FirstOrDefaultAsync(e => e.Id == invite.EmployeeId && e.IsActive, cancellationToken);

            if (employee == null)
            {
                return Results.NotFound("Associated employee is no longer active.");
            }

            if (string.IsNullOrEmpty(employee.TotpSecret))
            {
                employee.TotpSecret = totpService.GenerateSecret();
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var qrUri = totpService.GetQrCodeUri(employee.Email, employee.TotpSecret);

            return Results.Ok(new InviteDetailsDto(
                employee.Id,
                employee.FirstName,
                employee.LastName,
                employee.Email,
                employee.TotpSecret,
                qrUri
            ));
        }).AllowAnonymous();

        // GET /api/roles - Admin only
        group.MapGet("roles", async (
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var roles = await dbContext.Roles
                .Select(r => new RoleDto(r.Id, r.Name, r.Description))
                .ToListAsync(cancellationToken);

            return Results.Ok(roles);
        }).RequireAuthorization("AdminOnly");
    }
}

public record EmployeeListDto(Guid Id, string EmployeeCode, string FirstName, string LastName, string Email, string? Phone, bool IsActive, bool IsTotpSetUp);
public record EmployeeDetailsDto(Guid Id, Guid StoreId, string EmployeeCode, string FirstName, string LastName, string Email, string? Phone, bool IsActive, bool IsTotpSetUp, List<string> Roles);
public record CreateEmployeeRequest(Guid StoreId, string EmployeeCode, string FirstName, string LastName, string Email, string? Phone, List<int> RoleIds);
public record UpdateEmployeeRequest(string FirstName, string LastName, string Email, string? Phone, List<int> RoleIds);
public record UpdateEmployeeStatusRequest(bool IsActive);
public record TotpSetupResponse(string Secret, string QrCodeUri);
public record VerifyTotpRequest(string Code);
public record InviteResponse(string InviteLink);
public record InviteDetailsDto(Guid EmployeeId, string FirstName, string LastName, string Email, string TotpSecret, string QrCodeUri);
public record RoleDto(int Id, string Name, string Description);
