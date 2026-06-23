using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static APIDRODIN.Controllers.SupplierController;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;

namespace APIDRODIN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SaltController : ControllerBase
    {
        private readonly string _connectionString;

        public SaltController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public class Salt
        {
            public int SaltID { get; set; }
            public string Name { get; set; }
        }
     

        [HttpGet("GetSalts")]
        public async Task<ActionResult<IEnumerable<Salt>>> GetSalts()
        {
            List<Salt> Salts = new List<Salt>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT SaltID, Name FROM Salt", conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            Salts.Add(new Salt
                            {
                                SaltID = reader.GetInt32(0),
                                Name = reader.GetString(1),
                            });
                        }
                    }
                }
            }

            return Ok(Salts);
        }


        [HttpPost("insertsalt")]
        public async Task<ActionResult<Supplier>> PostSalt(Salt salt)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("INSERT INTO Salt (Name) OUTPUT INSERTED.SaltID VALUES (@Name)", conn))
                {
                    cmd.Parameters.AddWithValue("@Name", salt.Name ?? (object)DBNull.Value);


                    salt.SaltID = (int)await cmd.ExecuteScalarAsync();
                }
            }

            return CreatedAtAction(nameof(GetSalts), new { id = salt.SaltID }, salt);
        }


        [HttpPut("UpdateSalt/{SaltID}")]
        public async Task<IActionResult> PutSalt(int SaltID, Salt salt)
        {
            if (SaltID != salt.SaltID) return BadRequest();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("UPDATE Salt SET Name = @Name WHERE SaltID = @SaltID", conn))
                {
                    cmd.Parameters.AddWithValue("@SaltID", salt.SaltID);
                    cmd.Parameters.AddWithValue("@Name", salt.Name ?? (object)DBNull.Value);
                   
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }

            return Ok(new { Message = "Salt Updated successfully." });
        }

        [HttpDelete("{id}")]
        
        public async Task<IActionResult> DeleteSalt(int id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("DELETE FROM Salt WHERE SaltID = @SaltID", conn))
                {
                    cmd.Parameters.AddWithValue("@SaltID", id);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }

            return NoContent();
        }

    }
}
