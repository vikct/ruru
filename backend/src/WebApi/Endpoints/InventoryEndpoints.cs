using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Ruru.Application.Features.Inventory.Commands.CreateProduct;
using Ruru.Application.Features.Inventory.Commands.UpdateProduct;
using Ruru.Application.Features.Inventory.Commands.DeleteProduct;
using Ruru.Application.Features.Inventory.Queries.GetProducts;

namespace Ruru.WebApi.Endpoints;

public class InventoryEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("api/inventory");

        group.MapGet("", async (
            [FromQuery] string? search,
            [FromQuery(Name = "category")] string[]? categories,
            [FromQuery] string? sortBy,
            [FromQuery] bool? sortDescending,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            var query = new GetProductsQuery
            {
                Search = search,
                Categories = categories != null ? new List<string>(categories) : null,
                SortBy = sortBy,
                SortDescending = sortDescending ?? false,
                Page = page ?? 1,
                PageSize = pageSize ?? 10
            };

            var result = await sender.Send(query, cancellationToken);
            return Results.Ok(result);
        });

        group.MapPost("", async (
            [FromBody] CreateProductCommand command,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            var id = await sender.Send(command, cancellationToken);
            return Results.Created($"/api/inventory/{id}", id);
        });

        group.MapPut("{id:guid}", async (
            Guid id,
            [FromBody] UpdateProductCommand command,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            if (id != command.Id)
            {
                return Results.BadRequest("Path ID does not match body ID.");
            }

            await sender.Send(command, cancellationToken);
            return Results.NoContent();
        });

        group.MapDelete("{id:guid}", async (
            Guid id,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            var command = new DeleteProductCommand { Id = id };
            await sender.Send(command, cancellationToken);
            return Results.NoContent();
        });
    }
}
