using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace APIDRODIN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ManufacturerController : ControllerBase
    {
        private readonly string _connectionString;

        public ManufacturerController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public class Manufacturer
        {
            public int ManufacturerID { get; set; }
            public string Name { get; set; }
            public string Address { get; set; }
            public string Email { get; set; }
            public string PhoneNumber { get; set; }
            public string OtherInformation { get; set; }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Manufacturer>>> GetManufacturers()
        {
            List<Manufacturer> manufacturers = new List<Manufacturer>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT ManufacturerID, Name, Address, Email, PhoneNumber, OtherInformation FROM Manufacturer", conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            manufacturers.Add(new Manufacturer
                            {
                                ManufacturerID = reader.GetInt32(0),
                                Name = reader.IsDBNull(1) ? null : reader.GetString(1),
                                Address = reader.IsDBNull(2) ? null : reader.GetString(2),
                                Email = reader.IsDBNull(3) ? null : reader.GetString(3),
                                PhoneNumber = reader.IsDBNull(4) ? null : reader.GetString(4),
                                OtherInformation = reader.IsDBNull(5) ? null : reader.GetString(5),
                            });
                        }
                    }
                }
            }

            return Ok(manufacturers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Manufacturer>> GetManufacturer(int id)
        {
            Manufacturer manufacturer = null;
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT ManufacturerID, Name, Address, Email, PhoneNumber, OtherInformation FROM Manufacturer WHERE ManufacturerID = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            manufacturer = new Manufacturer
                            {
                                ManufacturerID = reader.GetInt32(0),
                                Name = reader.IsDBNull(1) ? null : reader.GetString(1),
                                Address = reader.IsDBNull(2) ? null : reader.GetString(2),
                                Email = reader.IsDBNull(3) ? null : reader.GetString(3),
                                PhoneNumber = reader.IsDBNull(4) ? null : reader.GetString(4),
                                OtherInformation = reader.IsDBNull(5) ? null : reader.GetString(5),
                            };
                        }
                    }
                }
            }
            if (manufacturer == null) return NotFound();
            return Ok(manufacturer);
        }

        [HttpGet("ManufacturerDelete")]
        public async Task<IActionResult> DeleteManufacturer(int ManufacturerId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("DELETE FROM Manufacturer WHERE ManufacturerID = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", ManufacturerId);
                    int rows = await cmd.ExecuteNonQueryAsync();
                    if (rows == 0) return NotFound();
                }
            }
            return Ok(new object());
        }

        [HttpGet("linkSaltwithManufacturer")]
        public async Task<IActionResult> LinkSaltWithManufacturer(int ManufacturerId, int SaltId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("INSERT INTO ManufacturerSalt (ManufacturerID, SaltID, CreatedAt) VALUES (@MId, @SId, GETDATE())", conn))
                {
                    cmd.Parameters.AddWithValue("@MId", ManufacturerId);
                    cmd.Parameters.AddWithValue("@SId", SaltId);
                    await cmd.ExecuteNonQueryAsync();
                }
            }
            return Ok(new object());
        }
    }
}
