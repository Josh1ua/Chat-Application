using Chat.Models;
using Microsoft.EntityFrameworkCore;

namespace Chat.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<MessageModel> Messages { get; set; }
}

