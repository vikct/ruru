using System;

namespace Ruru.Domain.Entities;

public class InviteToken
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
