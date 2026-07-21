# Employee Management & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement admin-only employee management with invite-based registration and passwordless TOTP-only authentication that works fully offline.

**Architecture:** 
- The backend replaces the old `User` entity with `Employee`, seeds standard roles (Admin, Manager, Therapist, Cashier), and uses a standard TOTP library (e.g., `OtpNet`) to generate and verify codes.
- Authenticated sessions issue short-lived JWT access tokens and secure refresh tokens with rotation.
- On the frontend, active employee records and TOTP secrets are cached in Dexie (IndexedDB), and the SPA uses `otpauth` to verify codes locally when offline.

**Tech Stack:**
- Backend: .NET 10 Minimal APIs, Carter, MediatR, EF Core, OtpNet (NuGet)
- Frontend: Angular 21, PrimeNG 19, Taiga UI, Dexie.js, otpauth (npm)

## Global Constraints

- Keep the POS system mobile-first and responsive.
- Every store-scoped entity must include a `StoreId` (UUID) column.
- Keep the POS fully functional offline; sync all queued data when back online.
- Vouchers and Employee Management pages must be strictly restricted to Admins.

---

### Task 1: NuGet and npm Dependencies

**Files:**
- Modify: `backend/src/Infrastructure/Ruru.Infrastructure.csproj`
- Modify: `angular/package.json`

**Interfaces:**
- Consumes: None
- Produces: `OtpNet` NuGet package in backend, `otpauth` npm package in frontend

- [ ] **Step 1: Add OtpNet package to backend**
  Add dependency to `backend/src/Infrastructure/Ruru.Infrastructure.csproj`:
  ```xml
  <PackageReference Include="OtpNet" Version="1.4.0" />
  ```

- [ ] **Step 2: Run dotnet restore**
  Run: `dotnet restore backend/Ruru.slnx`
  Expected: Successful restore with no errors.

- [ ] **Step 3: Add otpauth package to frontend**
  Add dependency to `angular/package.json`:
  ```json
  "dependencies": {
    ...
    "otpauth": "^9.3.6"
  }
  ```

- [ ] **Step 4: Run npm install**
  Run: `npm install --prefix angular`
  Expected: Successful installation of `otpauth` and its dependencies.

- [ ] **Step 5: Commit changes**
  ```bash
  git add backend/src/Infrastructure/Ruru.Infrastructure.csproj angular/package.json angular/package-lock.json
  git commit -m "chore: add OtpNet and otpauth dependencies for TOTP auth"
  ```

---

### Task 2: Database Entities & Schema Migration

**Files:**
- Delete: `backend/src/Domain/Entities/User.cs`
- Create: `backend/src/Domain/Entities/Employee.cs`
- Create: `backend/src/Domain/Entities/Role.cs`
- Create: `backend/src/Domain/Entities/EmployeeRole.cs`
- Create: `backend/src/Domain/Entities/InviteToken.cs`
- Create: `backend/src/Domain/Entities/RefreshToken.cs`
- Modify: `backend/src/Infrastructure/Persistence/ApplicationDbContext.cs`

**Interfaces:**
- Consumes: None
- Produces: New database tables `Employees`, `Roles`, `EmployeeRoles`, `InviteTokens`, `RefreshTokens`. Replaces `Users`.

- [ ] **Step 1: Create Employee entity**
  Create `backend/src/Domain/Entities/Employee.cs`:
  ```csharp
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
  ```

- [ ] **Step 2: Create Role entity**
  Create `backend/src/Domain/Entities/Role.cs`:
  ```csharp
  namespace Ruru.Domain.Entities;

  public class Role
  {
      public int Id { get; set; }
      public string Name { get; set; } = string.Empty;
      public string Description { get; set; } = string.Empty;
  }
  ```

- [ ] **Step 3: Create EmployeeRole entity**
  Create `backend/src/Domain/Entities/EmployeeRole.cs`:
  ```csharp
  using System;

  namespace Ruru.Domain.Entities;

  public class EmployeeRole
  {
      public Guid EmployeeId { get; set; }
      public int RoleId { get; set; }
  }
  ```

- [ ] **Step 4: Create InviteToken entity**
  Create `backend/src/Domain/Entities/InviteToken.cs`:
  ```csharp
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
  ```

- [ ] **Step 5: Create RefreshToken entity**
  Create `backend/src/Domain/Entities/RefreshToken.cs`:
  ```csharp
  using System;

  namespace Ruru.Domain.Entities;

  public class RefreshToken
  {
      public Guid Id { get; set; }
      public Guid EmployeeId { get; set; }
      public string Token { get; set; } = string.Empty;
      public DateTime ExpiresAt { get; set; }
      public string? DeviceInfo { get; set; }
      public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
      public DateTime? RevokedAt { get; set; }
  }
  ```

- [ ] **Step 6: Update DB Context mapping**
  Modify mappings in `backend/src/Infrastructure/Persistence/ApplicationDbContext.cs` to remove `Users` and add DbSets for the new entities, configuring the composite key for `EmployeeRole` and seed data for `Role` (Admin = 1, Manager = 2, Therapist = 3, Cashier = 4).
  Include a seed for a default `StoreId` and an initial Admin employee who is pre-configured with a dummy TOTP secret for first login.

- [ ] **Step 7: Run EF migration commands**
  Run:
  ```bash
  dotnet ef migrations add ReplaceUserWithEmployeeAndRoles --project backend/src/Infrastructure --startup-project backend/src/WebApi
  dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/WebApi
  ```
  Expected: Successful build, migration creation, and database update.

- [ ] **Step 8: Commit changes**
  ```bash
  git rm backend/src/Domain/Entities/User.cs
  git add backend/src/Domain/Entities/Employee.cs backend/src/Domain/Entities/Role.cs backend/src/Domain/Entities/EmployeeRole.cs backend/src/Domain/Entities/InviteToken.cs backend/src/Domain/Entities/RefreshToken.cs backend/src/Infrastructure/Persistence/ApplicationDbContext.cs backend/src/Infrastructure/Migrations/
  git commit -m "feat: replace User with Employee/Roles, add TOTP related entities, and run migrations"
  ```

---

### Task 3: TOTP & Cryptography Services (Backend)

**Files:**
- Create: `backend/src/Application/Common/Interfaces/ITotpService.cs`
- Create: `backend/src/Infrastructure/Services/TotpService.cs`
- Modify: `backend/src/Infrastructure/DependencyInjection.cs`

**Interfaces:**
- Consumes: `OtpNet` package
- Produces: `ITotpService` interface and its implementation registered in DI.
  - `string GenerateSecret()`
  - `string GetQrCodeUri(string email, string secret)`
  - `bool VerifyCode(string secret, string code)`

- [ ] **Step 1: Create ITotpService interface**
  Create `backend/src/Application/Common/Interfaces/ITotpService.cs`:
  ```csharp
  namespace Ruru.Application.Common.Interfaces;

  public interface ITotpService
  {
      string GenerateSecret();
      string GetQrCodeUri(string email, string secret);
      bool VerifyCode(string secret, string code);
  }
  ```

- [ ] **Step 2: Implement TotpService**
  Create `backend/src/Infrastructure/Services/TotpService.cs` using `OtpNet`:
  ```csharp
  using OtpNet;
  using Ruru.Application.Common.Interfaces;

  namespace Ruru.Infrastructure.Services;

  public class TotpService : ITotpService
  {
      public string GenerateSecret()
      {
          var key = KeyGeneration.GenerateRandomKey(20);
          return Base32Encoding.ToString(key);
      }

      public string GetQrCodeUri(string email, string secret)
      {
          return $"otpauth://totp/RuruPOS:{email}?secret={secret}&issuer=RuruPOS";
      }

      public bool VerifyCode(string secret, string code)
      {
          try
          {
              var key = Base32Encoding.ToBytes(secret);
              var totp = new Totp(key);
              return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
          }
          catch
          {
              return false;
          }
      }
  }
  ```

- [ ] **Step 3: Register ITotpService in Infrastructure DependencyInjection**
  Modify `backend/src/Infrastructure/DependencyInjection.cs`:
  ```csharp
  services.AddSingleton<ITotpService, TotpService>();
  ```

- [ ] **Step 4: Create unit tests for TotpService**
  Create `backend/tests/Infrastructure.UnitTests/Services/TotpServiceTests.cs` (or equivalent test directory) verifying secret generation, format validation, and correct matching of codes.

- [ ] **Step 5: Run backend tests**
  Run: `dotnet test backend`
  Expected: All tests pass.

- [ ] **Step 6: Commit changes**
  ```bash
  git add backend/src/Application/Common/Interfaces/ITotpService.cs backend/src/Infrastructure/Services/TotpService.cs backend/src/Infrastructure/DependencyInjection.cs
  git commit -m "feat: implement ITotpService using OtpNet"
  ```

---

### Task 4: Token & Authentication Services (Backend)

**Files:**
- Create: `backend/src/Application/Common/Interfaces/IIdentityService.cs`
- Create: `backend/src/Infrastructure/Services/IdentityService.cs`
- Modify: `backend/src/Infrastructure/DependencyInjection.cs`

**Interfaces:**
- Consumes: None (uses standard `System.IdentityModel.Tokens.Jwt`)
- Produces: `IIdentityService` interface and its implementation registered in DI.
  - `(string AccessToken, string RefreshToken) IssueTokens(Employee employee, List<string> roles)`
  - `ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)`

- [ ] **Step 1: Create IIdentityService interface**
  Create `backend/src/Application/Common/Interfaces/IIdentityService.cs`:
  ```csharp
  using System.Collections.Generic;
  using System.Security.Claims;
  using Ruru.Domain.Entities;

  namespace Ruru.Application.Common.Interfaces;

  public interface IIdentityService
  {
      (string AccessToken, string RefreshToken) IssueTokens(Employee employee, List<string> roles);
      ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
  }
  ```

- [ ] **Step 2: Implement IdentityService**
  Create `backend/src/Infrastructure/Services/IdentityService.cs` generating JWT with claims for `employeeId`, `storeId`, and custom roles list. Reads JWT config key/expiration from `appsettings.json`.

- [ ] **Step 3: Register IdentityService in DependencyInjection**
  Add `services.AddScoped<IIdentityService, IdentityService>();` to `DependencyInjection.cs`.

- [ ] **Step 4: Add JwtSettings configuration**
  Add JWT config structure to `backend/src/WebApi/appsettings.json`.

- [ ] **Step 5: Write IdentityService unit tests**
  Write tests for token parsing and claims extraction. Verify token signature checks.

- [ ] **Step 6: Run tests and commit**
  Run: `dotnet test backend`
  Expected: PASS
  ```bash
  git add backend/src/Application/Common/Interfaces/IIdentityService.cs backend/src/Infrastructure/Services/IdentityService.cs backend/src/Infrastructure/DependencyInjection.cs backend/src/WebApi/appsettings.json
  git commit -m "feat: implement JWT token issuance and validation service"
  ```

---

### Task 5: Auth & Employee Endpoints (Backend)

**Files:**
- Create: `backend/src/WebApi/Endpoints/AuthEndpoints.cs`
- Create: `backend/src/WebApi/Endpoints/EmployeeEndpoints.cs`
- Modify: `backend/src/WebApi/Program.cs`

**Interfaces:**
- Consumes: `ITotpService`, `IIdentityService`, MediatR
- Produces: Minimal API endpoints for `/auth/login`, `/auth/refresh`, `/auth/logout`, `/employees` (Admin-only GET/POST/PUT/PATCH), and `/roles` (GET).

- [ ] **Step 1: Implement AuthEndpoints**
  Create `backend/src/WebApi/Endpoints/AuthEndpoints.cs` using Carter:
  - `POST /auth/login` checks employee code and validates TOTP, then returns access + refresh tokens.
  - `POST /auth/refresh` validates expired token & active refresh token, rotating refresh token.
  - `POST /auth/logout` revokes active refresh token.

- [ ] **Step 2: Implement EmployeeEndpoints**
  Create `backend/src/WebApi/Endpoints/EmployeeEndpoints.cs` mapping employee CRUD operations. Includes:
  - `POST /employees/{id}/totp-setup`: admin-only generation of secret and returning it + QR URI.
  - `POST /employees/{id}/totp-verify`: validates setup by testing first code. Marks `IsTotpSetUp = true`.
  - `POST /employees/{id}/invite`: triggers an invitation email via Resend (or console-logged link in dev).

- [ ] **Step 3: Register Endpoints in WebApi Program.cs**
  Ensure Carter endpoint mapping registers the new endpoints.

- [ ] **Step 4: Write API endpoint integration tests**
  Write tests checking correct status code returns and role authorization enforcement.

- [ ] **Step 5: Run tests and commit**
  Run: `dotnet test backend`
  Expected: PASS
  ```bash
  git add backend/src/WebApi/Endpoints/AuthEndpoints.cs backend/src/WebApi/Endpoints/EmployeeEndpoints.cs backend/src/WebApi/Program.cs
  git commit -m "feat: map Auth and Employee Minimal API endpoints using Carter"
  ```

---

### Task 6: Dexie Database Tables Setup (Frontend)

**Files:**
- Modify: `angular/src/app/core/db.service.ts`

**Interfaces:**
- Consumes: Dexie.js
- Produces: Updated schema version and tables: `employees`, `roles`, `vouchers`

- [ ] **Step 1: Modify DbService**
  Open `angular/src/app/core/db.service.ts` and update it to configure Version 3, declaring tables:
  ```typescript
  export interface LocalEmployee {
    id: string;
    storeId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    totpSecret: string;
    isTotpSetUp: boolean;
    isActive: boolean;
    profilePhotoUrl?: string;
  }

  export interface LocalRole {
    id: number;
    name: string;
    description: string;
  }
  ```

- [ ] **Step 2: Update construction versioning**
  Modify constructor to define version 3:
  ```typescript
  this.version(3).stores({
    products: 'id, sku, name, category, syncStatus',
    pendingDeletions: 'id',
    employees: 'id, employeeCode, email, isActive',
    roles: 'id, name',
    vouchers: 'id, code, isActive'
  });
  ```

- [ ] **Step 3: Verify build**
  Run: `npm run build --prefix angular`
  Expected: Clean build with no compile errors.

- [ ] **Step 4: Commit changes**
  ```bash
  git add angular/src/app/core/db.service.ts
  git commit -m "feat: define employees, roles, and vouchers Dexie tables in frontend"
  ```

---

### Task 7: Frontend Authentication Service (AuthService)

**Files:**
- Create: `angular/src/app/core/services/auth.service.ts`

**Interfaces:**
- Consumes: `HttpClient`, `DbService`, `otpauth` package
- Produces: `AuthService` handling active tokens, login/logout, offline verification logic, token refresh interval, and User/Role signals.

- [ ] **Step 1: Implement AuthService**
  Create `angular/src/app/core/services/auth.service.ts` implementing:
  - Active user signals: `currentUser = signal<LocalEmployee | null>(null)`
  - Active roles: `currentRoles = signal<string[]>([])`
  - Online check: `isOnline = signal<boolean>(navigator.onLine)`
  - Login method:
    - If Online: POST to `/auth/login`. On success, cache tokens and employee details in Dexie.
    - If Offline: Query Dexie `employees` by employeeCode/ID. Calculate TOTP using `otpauth.TOTP` and compare. On match, set state.
  - Refresh logic: automatic background API refresh loop.

- [ ] **Step 2: Add AuthService unit tests**
  Create `angular/src/app/core/services/auth.service.spec.ts` mocking `HttpClient` and testing offline login with mock IndexedDB data.

- [ ] **Step 3: Verify frontend tests**
  Run: `npm run test --prefix angular` (or equivalent test command)
  Expected: Pass.

- [ ] **Step 4: Commit changes**
  ```bash
  git add angular/src/app/core/services/auth.service.ts
  git commit -m "feat: implement AuthService with online API and offline local TOTP support"
  ```

---

### Task 8: Authentication Components (Login & Setup)

**Files:**
- Create: `angular/src/app/features/auth/login/login.component.ts`
- Create: `angular/src/app/features/auth/login/login.component.html`
- Create: `angular/src/app/features/auth/login/login.component.scss`
- Create: `angular/src/app/features/auth/totp-setup/totp-setup.component.ts`
- Create: `angular/src/app/features/auth/totp-setup/totp-setup.component.html`
- Create: `angular/src/app/features/auth/totp-setup/totp-setup.component.scss`
- Modify: `angular/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `AuthService`, Taiga UI components (`tui-select`, `tui-button`, `tui-textfield`, etc.)
- Produces: Screens for shared counter login and setup verification. Responsive to light/dark themes.

- [ ] **Step 1: Implement LoginComponent**
  Create `angular/src/app/features/auth/login/login.component.ts`, `.html`, & `.scss`.
  - Use Taiga UI Select component (`tui-select`) for selecting the employee from the list.
  - Use Taiga UI components for the 6-digit TOTP code input.
  - In `login.component.scss`, style the login card and background. Statically style colors using variables like `var(--bg-sidebar)`, `var(--text-primary)`, `var(--border)`, and `var(--bg-base)` to automatically adapt to `.ruru-dark` class.

- [ ] **Step 2: Implement TotpSetupComponent**
  Create `angular/src/app/features/auth/totp-setup/totp-setup.component.ts`, `.html`, & `.scss` displaying the QR code (base64 or SVG) and a Taiga UI code field input to verify the setup code.
  - Style with SCSS using CSS variables to support light/dark modes.

- [ ] **Step 3: Configure routes**
  Modify `angular/src/app/app.routes.ts` to add routes for `/auth/login` and `/auth/totp-setup`.

- [ ] **Step 4: Commit changes**
  ```bash
  git add angular/src/app/features/auth/login/ angular/src/app/features/auth/totp-setup/ angular/src/app/app.routes.ts
  git commit -m "feat: add LoginComponent and TotpSetupComponent with routes using Taiga UI & SCSS"
  ```

---

### Task 9: Employee Admin Management Interface

**Files:**
- Create: `angular/src/app/features/employees/employee-list/employee-list.component.ts`
- Create: `angular/src/app/features/employees/employee-list/employee-list.component.html`
- Create: `angular/src/app/features/employees/employee-list/employee-list.component.scss`
- Create: `angular/src/app/features/employees/employee-form/employee-form.component.ts`
- Create: `angular/src/app/features/employees/employee-form/employee-form.component.html`
- Create: `angular/src/app/features/employees/employee-form/employee-form.component.scss`
- Modify: `angular/src/app/app.routes.ts`

**Interfaces:**
- Consumes: Admin roles, Taiga UI table, buttons, inputs
- Produces: Admin-only CRUD views. Responsive to light/dark themes.

- [ ] **Step 1: Add Admin role guards**
  Create route guards restricting access to `/employees` to Admin only.

- [ ] **Step 2: Implement EmployeeListComponent**
  Create list/search of active employees. Include action to generate TOTP QR on screen or send invite email.
  - Use Taiga UI Table or list components.
  - Style with SCSS supporting light/dark theme tokens.

- [ ] **Step 3: Implement EmployeeFormComponent**
  Form allowing creation/updating details and assigning roles.
  - Use Taiga UI input elements and checkboxes/multiselect for multi-role assignment.
  - Style with SCSS using theme CSS variables.

- [ ] **Step 4: Register routes**
  Update `angular/src/app/app.routes.ts` with `/employees` and `/employees/:id` protected by guards.

- [ ] **Step 5: Verify build & commit**
  Run: `npm run build --prefix angular`
  Expected: SUCCESS
  ```bash
  git add angular/src/app/features/employees/ angular/src/app/app.routes.ts
  git commit -m "feat: implement Admin-only Employee management screens and routes with Taiga UI & SCSS"
  ```
