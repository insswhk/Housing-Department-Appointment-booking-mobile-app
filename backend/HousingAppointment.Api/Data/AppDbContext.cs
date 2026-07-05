using HousingAppointment.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HousingAppointment.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Estate> Estates => Set<Estate>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<AppointmentSlot> Slots => Set<AppointmentSlot>();
    public DbSet<Appointment> Appointments => Set<Appointment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.TenancyNumber)
            .IsUnique();

        modelBuilder.Entity<Appointment>()
            .HasIndex(a => a.SlotId)
            .IsUnique();
    }
}
