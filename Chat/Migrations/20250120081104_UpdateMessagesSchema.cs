using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chat.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMessagesSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Timestamp",
                table: "Messages",
                newName: "timestamp");

            migrationBuilder.RenameColumn(
                name: "Sender",
                table: "Messages",
                newName: "sender");

            migrationBuilder.RenameColumn(
                name: "Receiver",
                table: "Messages",
                newName: "receiver");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Messages",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "SenderRole",
                table: "Messages",
                newName: "sender_role");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "timestamp",
                table: "Messages",
                newName: "Timestamp");

            migrationBuilder.RenameColumn(
                name: "sender",
                table: "Messages",
                newName: "Sender");

            migrationBuilder.RenameColumn(
                name: "receiver",
                table: "Messages",
                newName: "Receiver");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Messages",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "sender_role",
                table: "Messages",
                newName: "SenderRole");
        }
    }
}
