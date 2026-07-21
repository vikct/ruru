using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ruru.Application.Common.Interfaces;
using Ruru.Domain.Entities;

namespace Ruru.Application.Features.Inventory.Commands.UpdateProduct;

public record UpdateProductCommand : IRequest<Unit>
{
    public Guid Id { get; init; }
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

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(v => v.Sku)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(50).WithMessage("SKU must not exceed 50 characters.")
            .MustAsync(BeUniqueSku).WithMessage("The specified SKU already exists on another product.");

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

    private async Task<bool> BeUniqueSku(UpdateProductCommand model, string sku, CancellationToken cancellationToken)
    {
        return !await _context.Products
            .AnyAsync(p => p.Id != model.Id && p.Sku.ToLower() == sku.ToLower(), cancellationToken);
    }
}

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product == null)
        {
            throw new Exception($"Product with ID {request.Id} was not found.");
        }

        product.Sku = request.Sku.Trim();
        product.Name = request.Name.Trim();
        product.Description = request.Description.Trim();
        product.Category = request.Category.Trim();
        product.QuantityInStock = request.QuantityInStock;
        product.ReorderLevel = request.ReorderLevel;
        product.CostPrice = request.CostPrice;
        product.SellingPrice = request.SellingPrice;
        product.Supplier = request.Supplier.Trim();
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
