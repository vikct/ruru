using System.Collections.Generic;
using System.Security.Claims;
using Ruru.Domain.Entities;

namespace Ruru.Application.Common.Interfaces;

public interface IIdentityService
{
    (string AccessToken, string RefreshToken) IssueTokens(Employee employee, List<string> roles);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
