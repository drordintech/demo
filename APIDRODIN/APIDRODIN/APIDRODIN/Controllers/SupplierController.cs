using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace APIDRODIN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierController : ControllerBase
    {
        private readonly string _connectionString;

        public SupplierController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public class Supplier
        {
            public int SupplierID { get; set; }
            public string Name { get; set; }
            public string Address { get; set; }
            public string Email { get; set; }
            public string PhoneNumber { get; set; }
            public string OtherInformation { get; set; }
            public string State { get; set; }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Supplier>>> GetSuppliers()
        {
            List<Supplier> suppliers = new List<Supplier>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT SupplierID, Name, Address, Email, PhoneNumber, OtherInformation, State FROM Supplier", conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            suppliers.Add(new Supplier
                            {
                                SupplierID = reader.GetInt32(0),
                                Name = reader.GetString(1),
                                Address = reader.IsDBNull(2) ? null : reader.GetString(2),
                                Email = reader.IsDBNull(3) ? null : reader.GetString(3),
                                PhoneNumber = reader.IsDBNull(4) ? null : reader.GetString(4),
                                OtherInformation = reader.IsDBNull(5) ? null : reader.GetString(5),
                                State = reader.IsDBNull(6) ? null : reader.GetString(6)
                            });
                        }
                    }
                }
            }

            return Ok(suppliers);
        }

        
        [HttpGet("{id}")]
        public async Task<ActionResult<Supplier>> GetSupplier(int id)
        {
            Supplier supplier = null;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT SupplierID, Name, Address, Email, PhoneNumber, OtherInformation, State FROM Supplier WHERE SupplierID = @SupplierID", conn))
                {
                    cmd.Parameters.AddWithValue("@SupplierID", id);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            supplier = new Supplier
                            {
                                SupplierID = reader.GetInt32(0),
                                Name = reader.GetString(1),
                                Address = reader.IsDBNull(2) ? null : reader.GetString(2),
                                Email = reader.IsDBNull(3) ? null : reader.GetString(3),
                                PhoneNumber = reader.IsDBNull(4) ? null : reader.GetString(4),
                                OtherInformation = reader.IsDBNull(5) ? null : reader.GetString(5),
                                State = reader.IsDBNull(6) ? null : reader.GetString(6)
                            };
                        }
                    }
                }
            }

            if (supplier == null) return NotFound();
            return supplier;
        }
       
        [HttpPost]
        public async Task<ActionResult<Supplier>> PostSupplier(Supplier supplier)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("INSERT INTO Supplier (Name, Address, Email, PhoneNumber, OtherInformation, State) OUTPUT INSERTED.SupplierID VALUES (@Name, @Address, @Email, @PhoneNumber, @OtherInformation, @State)", conn))
                {
                    cmd.Parameters.AddWithValue("@Name", supplier.Name ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Address", supplier.Address ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Email", supplier.Email ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@PhoneNumber", supplier.PhoneNumber ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@OtherInformation", supplier.OtherInformation ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@State", supplier.State ?? (object)DBNull.Value);

                    supplier.SupplierID = (int)await cmd.ExecuteScalarAsync();
                }
            }

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.SupplierID }, supplier);
        }

        [HttpPost("UpdateSupplier")]
        public async Task<IActionResult> PutSupplier(int SupplierID, Supplier supplier)
        {
            if (SupplierID != supplier.SupplierID) return BadRequest();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("UPDATE Supplier SET Name = @Name, Address = @Address, Email = @Email, PhoneNumber = @PhoneNumber, OtherInformation = @OtherInformation, State = @State WHERE SupplierID = @SupplierID", conn))
                {
                    cmd.Parameters.AddWithValue("@SupplierID", supplier.SupplierID);
                    cmd.Parameters.AddWithValue("@Name", supplier.Name ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Address", supplier.Address ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Email", supplier.Email ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@PhoneNumber", supplier.PhoneNumber ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@OtherInformation", supplier.OtherInformation ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@State", supplier.State ?? (object)DBNull.Value);

                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }

            return Ok(new { Message = "Supplier Updated successfully." });
        }

        [HttpGet("DeleteSuppliers")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("DELETE FROM Supplier WHERE SupplierID = @SupplierID", conn))
                {
                    cmd.Parameters.AddWithValue("@SupplierID", id);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }

            return NoContent();
        }

        [HttpGet("SupplierDelete")]
        public async Task<IActionResult> SupplierDelete(string SupplierId)
        {
            if (!int.TryParse(SupplierId, out int SupplierIdInt))
            {
                return BadRequest(new { Message = "Invalid Supplier ID. It must be a numeric value." });
            }

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("DELETE FROM Supplier WHERE SupplierID = @SupplierID", conn))
                {
                    cmd.Parameters.AddWithValue("@SupplierID", SupplierIdInt);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }

            return Ok(new { Message = "Supplier Deleted successfully." });
        }
    }
}
