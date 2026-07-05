namespace HousingAppointment.Api.Models;

public record RegisterTenantRequest(
    string TenancyNumber,
    string Hkid,
    string Name,
    string Phone,
    DateOnly DateOfBirth);

public record BookAppointmentRequest(int TenantId, int SlotId);
