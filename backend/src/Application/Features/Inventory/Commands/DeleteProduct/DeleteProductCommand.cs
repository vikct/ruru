using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ruru.Application.Common.Interfaces;

namespace Ruru.Application.Features.Inventory.Commands.DeleteProduct;

public record DeleteProductCommand : IRequest<Unit>
{
    public Guid Id { get; init; }
}

public class DeleteProductCommandValidator : AbstractValidator<DeleteProductCommand>
{
    public DeleteProductCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Product ID is required.");
    }
}

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public DeleteProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product == null)
        {
            throw new Exception($"Product with ID {request.Id} was not found.");
        }

        _context.Products.Remove(product);

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
