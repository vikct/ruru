# Ruru POS

Ruru is a high-performance, modular, and offline-first Point of Sales (POS) system.

## Structure

- **`backend/`**: .NET 10.0.202 Clean Architecture backend, configured with Minimal APIs, Carter, MediatR (CQRS), FluentValidation, Mapster, and EF Core.
- **`angular/`**: Angular 21.2.10 SPA client, using PrimeNG 19 and Tailwind CSS.


## Final Technical Stack & Patterns

### 1. Backend (.NET 10.0.202 Clean Architecture)
The backend is structured into four core projects to maintain clean separation of concerns, optimized for performance and developer velocity.

*   **API Layer (WebApi):** Uses **Minimal APIs with Carter** for routing, replacing heavy MVC controllers with lightweight, fast, and feature-organized endpoint mappings.
*   **Application Layer:** Implementing **CQRS with MediatR**. Business logic is split into explicit Commands and Queries.
    *   **Validation:** Automated using a MediatR Pipeline Behavior that intercepts commands and validates them via **FluentValidation** before execution.
    *   **Mapping:** Utilizing **Mapster** for high-performance, low-overhead object transformations between Entities and DTOs.
*   **Domain Layer:** Enterprise entities, value objects, and domain events.
*   **Infrastructure Layer:** **Entity Framework Core** for database mapping (supporting Postgres/Sqlite configurations) and integrations (like Firebase Authentication).

### 2. Frontend (Angular 21.2.10 + PrimeNG)
*   **UI Components:** **PrimeNG 19** styled mode using Aura/Lara design tokens.
*   **Layout & Custom Styles:** **Tailwind CSS** integrated alongside PrimeNG to handle layout grid, responsive utilities, and custom spacing.
*   **State & Reactivity:** **Angular Signals** for the reactive store (active cart state, register float details, offline transaction queue).
*   **Control Flow:** Modern `@if`, `@for`, and `@switch` syntax.

## Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js (v22+) and npm

### Local Development

1. **Backend:**
   ```bash
   cd backend
   dotnet restore
   dotnet run --project src/WebApi
   ```

2. **Frontend:**
   ```bash
   cd angular
   npm install
   npm start
   ```
