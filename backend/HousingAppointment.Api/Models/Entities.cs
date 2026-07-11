namespace HousingAppointment.Api.Models;

public class Estate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;

    public List<AppointmentSlot> Slots { get; set; } = new();
}

public class Tenant
{
    public int Id { get; set; }
    public string TenancyNumber { get; set; } = string.Empty;
    public string Hkid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
}

public class AppointmentSlot
{
    public int Id { get; set; }
    public int EstateId { get; set; }
    public Estate? Estate { get; set; }
    public DateTime StartTime { get; set; }
    public bool IsBooked { get; set; }
}

public class Appointment
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public Tenant? Tenant { get; set; }
    public int SlotId { get; set; }
    public AppointmentSlot? Slot { get; set; }
    public string Status { get; set; } = "Booked";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
