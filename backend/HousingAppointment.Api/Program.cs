using HousingAppointment.Api.Data;
using HousingAppointment.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")
                      ?? "Data Source=housing.db"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

const string CorsPolicy = "frontend";
builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Create + seed the database on startup (dev-friendly; no manual migration step).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(CorsPolicy);

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/estates", async (AppDbContext db) =>
    await db.Estates.OrderBy(e => e.Name).ToListAsync());

app.MapPost("/api/tenants/register", async (RegisterTenantRequest req, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.TenancyNumber) || string.IsNullOrWhiteSpace(req.Hkid)
        || string.IsNullOrWhiteSpace(req.Name))
    {
        return Results.BadRequest(new { error = "TenancyNumber, Hkid and Name are required." });
    }

    var existing = await db.Tenants.FirstOrDefaultAsync(t => t.TenancyNumber == req.TenancyNumber);
    if (existing is not null)
    {
        return Results.Ok(existing);
    }

    var tenant = new Tenant
    {
        TenancyNumber = req.TenancyNumber.Trim(),
        Hkid = req.Hkid.Trim(),
        Name = req.Name.Trim(),
        Phone = req.Phone?.Trim() ?? string.Empty,
        DateOfBirth = req.DateOfBirth
    };
    db.Tenants.Add(tenant);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tenants/{tenant.Id}", tenant);
});

app.MapGet("/api/estates/{estateId:int}/slots", async (int estateId, bool onlyAvailable, AppDbContext db) =>
{
    var query = db.Slots.Where(s => s.EstateId == estateId);
    if (onlyAvailable)
    {
        query = query.Where(s => !s.IsBooked);
    }
    var slots = await query.OrderBy(s => s.StartTime).ToListAsync();
    return Results.Ok(slots);
});

app.MapPost("/api/appointments", async (BookAppointmentRequest req, AppDbContext db) =>
{
    var tenant = await db.Tenants.FindAsync(req.TenantId);
    if (tenant is null)
    {
        return Results.BadRequest(new { error = "Unknown tenant." });
    }

    var slot = await db.Slots.FindAsync(req.SlotId);
    if (slot is null)
    {
        return Results.BadRequest(new { error = "Unknown slot." });
    }
    if (slot.IsBooked)
    {
        return Results.Conflict(new { error = "Slot is already booked." });
    }

    slot.IsBooked = true;
    var appointment = new Appointment { TenantId = tenant.Id, SlotId = slot.Id, Status = "Booked" };
    db.Appointments.Add(appointment);
    await db.SaveChangesAsync();

    var estate = await db.Estates.FindAsync(slot.EstateId);
    return Results.Created($"/api/appointments/{appointment.Id}", new
    {
        appointment.Id,
        appointment.Status,
        appointment.CreatedAt,
        Tenant = tenant.Name,
        Estate = estate?.Name,
        slot.StartTime
    });
});

app.MapGet("/api/tenants/{tenantId:int}/appointments", async (int tenantId, AppDbContext db) =>
{
    var appointments = await db.Appointments
        .Where(a => a.TenantId == tenantId)
        .Include(a => a.Slot!).ThenInclude(s => s.Estate)
        .OrderBy(a => a.Slot!.StartTime)
        .Select(a => new
        {
            a.Id,
            a.Status,
            a.CreatedAt,
            Estate = a.Slot!.Estate!.Name,
            District = a.Slot.Estate.District,
            a.Slot.StartTime
        })
        .ToListAsync();
    return Results.Ok(appointments);
});

app.Run();

// Exposed so integration tests can bootstrap the app via WebApplicationFactory.
public partial class Program { }

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Estates.Any())
        {
            return;
        }

        var estates = new List<Estate>
        {
            new() { Name = "Choi Hung Estate", District = "Wong Tai Sin" },
            new() { Name = "Mei Foo Sun Chuen", District = "Sham Shui Po" },
            new() { Name = "Wah Fu Estate", District = "Southern" }
        };
        db.Estates.AddRange(estates);
        db.SaveChanges();

        var startDate = DateTime.Today.AddDays(1).AddHours(9);
        foreach (var estate in estates)
        {
            for (var day = 0; day < 3; day++)
            {
                for (var hour = 0; hour < 4; hour++)
                {
                    db.Slots.Add(new AppointmentSlot
                    {
                        EstateId = estate.Id,
                        StartTime = startDate.AddDays(day).AddHours(hour)
                    });
                }
            }
        }
        db.SaveChanges();
    }
}
