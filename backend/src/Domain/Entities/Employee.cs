using System;

namespace Ruru.Domain.Entities;

public class Employee
{
    public Guid Id { get; set; }
    public Guid StoreId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string TotpSecret { get; set; } = string.Empty;
    public bool IsTotpSetUp { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ProfilePhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
