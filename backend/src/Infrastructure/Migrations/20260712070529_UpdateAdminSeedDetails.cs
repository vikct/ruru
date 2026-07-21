using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ruru.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminSeedDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                columns: new[] { "Email", "FirstName", "LastName" },
                values: new object[] { "fenrirwolfe@gmail.com", "Victor", "Tan" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"),
                columns: new[] { "Email", "FirstName", "LastName" },
                values: new object[] { "admin@rurupos.com", "System", "Admin" });
        }
    }
}
