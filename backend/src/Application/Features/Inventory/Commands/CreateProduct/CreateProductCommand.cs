using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ruru.Application.Common.Interfaces;
using Ruru.Domain.Entities;

namespace Ruru.Application.Features.Inventory.Commands.CreateProduct;

public record CreateProductCommand : IRequest<Guid>
{
    public Guid? Id { get; init; }
    public string Sku { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public int QuantityInStock { get; init; }
    public int ReorderLevel { get; init; }
    public decimal CostPrice { get; init; }
    public decimal SellingPrice { get; init; }
    public string Supplier { get; init; } = string.Empty;
}

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(v => v.Sku)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(50).WithMessage("SKU must not exceed 50 characters.")
            .MustAsync(BeUniqueSku).WithMessage("The specified SKU already exists.");

        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(150).WithMessage("Name must not exceed 150 characters.");

        RuleFor(v => v.Category)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(v => v.QuantityInStock)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity in stock must be 0 or positive.");

        RuleFor(v => v.ReorderLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Reorder level must be 0 or positive.");

        RuleFor(v => v.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Cost price must be 0 or positive.");

        RuleFor(v => v.SellingPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Selling price must be 0 or positive.");
    }

    private async Task<bool> BeUniqueSku(string sku, CancellationToken cancellationToken)
    {
        return !await _context.Products
            .AnyAsync(p => p.Sku.ToLower() == sku.ToLower(), cancellationToken);
    }
}

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var product = new Product
        {
            Id = request.Id ?? Guid.NewGuid(),
            Sku = request.Sku.Trim(),
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category.Trim(),
            QuantityInStock = request.QuantityInStock,
            ReorderLevel = request.ReorderLevel,
            CostPrice = request.CostPrice,
            SellingPrice = request.SellingPrice,
            Supplier = request.Supplier.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);

        await _context.SaveChangesAsync(cancellationToken);

        return product.Id;
    }
}
