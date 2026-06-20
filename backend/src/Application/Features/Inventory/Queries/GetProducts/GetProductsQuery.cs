using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ruru.Application.Common.Interfaces;

namespace Ruru.Application.Features.Inventory.Queries.GetProducts;

public record GetProductsQuery : IRequest<PaginatedResult<ProductDto>>
{
    public string? Search { get; init; }
    public string? Category { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PaginatedResult<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products.AsNoTracking();

        // Search Filter (SKU or Name)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchLower = request.Search.ToLower();
            query = query.Where(p => p.Sku.ToLower().Contains(searchLower) || p.Name.ToLower().Contains(searchLower));
        }

        // Category Filter
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var categoryLower = request.Category.ToLower();
            query = query.Where(p => p.Category.ToLower() == categoryLower);
        }

        // Sorting
        query = request.SortBy?.ToLower() switch
        {
            "sku" => request.SortDescending ? query.OrderByDescending(p => p.Sku) : query.OrderBy(p => p.Sku),
            "name" => request.SortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "quantity" or "quantityinstock" => request.SortDescending ? query.OrderByDescending(p => p.QuantityInStock) : query.OrderBy(p => p.QuantityInStock),
            "cost" or "costprice" => request.SortDescending ? query.OrderByDescending(p => p.CostPrice) : query.OrderBy(p => p.CostPrice),
            "price" or "sellingprice" => request.SortDescending ? query.OrderByDescending(p => p.SellingPrice) : query.OrderBy(p => p.SellingPrice),
            "category" => request.SortDescending ? query.OrderByDescending(p => p.Category) : query.OrderBy(p => p.Category),
            _ => query.OrderBy(p => p.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Sku = p.Sku,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
                QuantityInStock = p.QuantityInStock,
                ReorderLevel = p.ReorderLevel,
                CostPrice = p.CostPrice,
                SellingPrice = p.SellingPrice,
                Supplier = p.Supplier,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PaginatedResult<ProductDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
