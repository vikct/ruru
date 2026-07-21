# Ruru POS — Ditching SQLite for Neon PostgreSQL

> **Topic**: Migration from local SQLite database to online Neon PostgreSQL database while preserving the existing offline-first frontend sync.

---

## 1. Goal & Context

The goal is to transition the POS backend persistent storage from a local SQLite file (`ruru.db`) to a managed cloud database. This enables multi-device data sharing and centralization, which is critical for a distributed Point of Sale (POS) system. 

We will use **Neon PostgreSQL** on its free tier ($0) to host our data online. The frontend will continue to use **Dexie.js (IndexedDB)** for local cache and offline functionality, syncing changes via our established HTTP synchronization service to our ASP.NET Core API.

---

## 2. Infrastructure Configuration

### Database Layer
* **Provider**: Neon PostgreSQL (Free Tier)
* **Compute**: Shared compute with auto-suspend after inactivity.
* **Storage**: 10 GB.
* **ORM**: Entity Framework Core 10.0.x with `Npgsql.EntityFrameworkCore.PostgreSQL`.

### Resiliency & Auto-Suspend Mitigation
To prevent database cold start timeouts during auto-suspend wakeups:
1. **EF Core Connection Resiliency**: Configure the Npgsql provider with automatic retry on failure.
2. **Keep-Alive Check**: Update the Render cron keep-alive ping `/health` check to perform a lightweight query (e.g., `Database.CanConnectAsync()`) to keep the DB instance warm.

---

## 3. Database Migration Strategy

### Step 1: Wipe Old SQLite Migrations
Because EF Core migrations generate database-specific syntax (e.g., SQLite types vs Postgres types), the existing migrations under `backend/src/Infrastructure/Migrations` are incompatible.
* **Action**: Delete all files in the `backend/src/Infrastructure/Migrations` directory.
* **Result**: This discards the old coffee shop product seed records (`COF-ESP`, `COF-CAP`, `BAK-CCC`) which are no longer needed.

### Step 2: Regenerate PostgreSQL Migrations
A new, database-agnostic model snapshot and schema migration will be created:
* **Command**:
  ```bash
  dotnet ef migrations add InitialPostgres --project src/Infrastructure --startup-project src/WebApi -o Migrations
  ```
* **Retained Data (Seed)**: The new migration will include:
  * Table schema for `Employees`, `Roles`, `EmployeeRoles`, `InviteTokens`, `RefreshTokens`, and `Products`.
  * Seed data for standard Roles (`Admin`, `Manager`, `Therapist`, `Cashier`).
  * Seed data for the initial Admin employee (`EMP-001` - Victor Tan) with TOTP credentials to preserve login access.
  * An empty `Products` table (old coffee products discarded, new beauty products to be added dynamically).

### Step 3: Automatic Startup Migration Application
We will configure ASP.NET Core to automatically run migrations at startup:
* **Implementation**:
  ```csharp
  using (var scope = app.Services.CreateScope())
  {
      var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
      await dbContext.Database.MigrateAsync();
  }
  ```
* **Benefit**: Ensures any schema updates are deployed to Neon immediately upon backend startup without manual CLI invocation.

---

## 4. Code Modifications

### Dependency Injection
Modify [DependencyInjection.cs](file:///Users/victortan/Repos/ruru/backend/src/Infrastructure/DependencyInjection.cs):
```csharp
services.AddDbContext<ApplicationDbContext>(options =>
{
    if (connectionString.Contains("Host=") || connectionString.Contains("Server=") || connectionString.Contains("Port="))
    {
        options.UseNpgsql(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
        });
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});
```

### Health Endpoints
Modify or add health endpoints in WebApi project to query the database.
```csharp
app.MapGet("/health", async (ApplicationDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return canConnect ? Results.Ok(new { Status = "Healthy", DbConnected = true }) 
                      : Results.Problem("Database connection failed");
});
```

---

## 5. Verification Plan

### Automated Verification
* Run unit tests to verify database configuration loads.
* Generate and build migrations successfully.

### Manual Verification
1. Spin up a local PostgreSQL container or Neon development branch.
2. Run backend and verify `InitialPostgres` migration is applied on startup.
3. Verify that logging in as employee `EMP-001` via TOTP succeeds.
4. Perform typical POS actions (create a product, sync) and verify records are correctly inserted into the PostgreSQL database.
