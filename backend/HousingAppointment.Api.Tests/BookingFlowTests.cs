using System.Net;
using System.Net.Http.Json;
using HousingAppointment.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;

namespace HousingAppointment.Api.Tests;

public class BookingFlowTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BookingFlowTests(WebApplicationFactory<Program> factory)
    {
        // Use an isolated SQLite database file per test run.
        var dbName = $"test-{Guid.NewGuid():N}.db";
        _factory = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Default", $"Data Source={dbName}"));
    }

    [Fact]
    public async Task Estates_Are_Seeded()
    {
        var client = _factory.CreateClient();
        var estates = await client.GetFromJsonAsync<List<Estate>>("/api/estates");
        Assert.NotNull(estates);
        Assert.NotEmpty(estates!);
    }

    [Fact]
    public async Task Tenant_Can_Register_And_Book_An_Appointment()
    {
        var client = _factory.CreateClient();

        var register = await client.PostAsJsonAsync("/api/tenants/register", new
        {
            tenancyNumber = $"PRH-{Guid.NewGuid():N}".Substring(0, 12),
            hkid = "A1234567",
            name = "Test Tenant",
            phone = "51234567",
            dateOfBirth = "1980-05-20"
        });
        register.EnsureSuccessStatusCode();
        var tenant = await register.Content.ReadFromJsonAsync<Tenant>();
        Assert.NotNull(tenant);

        var slots = await client.GetFromJsonAsync<List<AppointmentSlot>>("/api/estates/1/slots?onlyAvailable=true");
        Assert.NotNull(slots);
        Assert.NotEmpty(slots!);
        var slotId = slots![0].Id;

        var book = await client.PostAsJsonAsync("/api/appointments", new { tenantId = tenant!.Id, slotId });
        Assert.Equal(HttpStatusCode.Created, book.StatusCode);

        var appointments = await client.GetFromJsonAsync<List<object>>($"/api/tenants/{tenant.Id}/appointments");
        Assert.NotNull(appointments);
        Assert.Single(appointments!);
    }

    [Fact]
    public async Task Double_Booking_A_Slot_Returns_Conflict()
    {
        var client = _factory.CreateClient();

        var register = await client.PostAsJsonAsync("/api/tenants/register", new
        {
            tenancyNumber = $"PRH-{Guid.NewGuid():N}".Substring(0, 12),
            hkid = "B7654321",
            name = "Second Tenant",
            phone = "52223333",
            dateOfBirth = "1975-01-01"
        });
        var tenant = await register.Content.ReadFromJsonAsync<Tenant>();

        var slots = await client.GetFromJsonAsync<List<AppointmentSlot>>("/api/estates/2/slots?onlyAvailable=true");
        var slotId = slots![0].Id;

        var first = await client.PostAsJsonAsync("/api/appointments", new { tenantId = tenant!.Id, slotId });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/appointments", new { tenantId = tenant.Id, slotId });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}
