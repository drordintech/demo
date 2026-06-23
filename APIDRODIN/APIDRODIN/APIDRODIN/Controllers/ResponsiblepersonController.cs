using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace APIDRODIN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResponsiblepersonController : ControllerBase
    {

        private readonly string _connectionString;

        public ResponsiblepersonController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpGet("GetResponsibleperson")]
      
        public async Task<ActionResult<IEnumerable<Responsibleperson>>> GetResponsiblepersons()
        {
            List<Responsibleperson> Responsiblepersons = new List<Responsibleperson>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT id, name FROM ResponsiblePerson", conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            Responsiblepersons.Add(new Responsibleperson
                            {
                                Id = reader.GetInt32(0),
                                Name = reader.GetString(1),
                            });
                        }
                    }
                }
            }
            return Ok(Responsiblepersons);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<Responsibleperson>> GetResponsibleperson(int id)
        {
            Responsibleperson Responsibleperson = null;
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT id,  name FROM ResponsiblePerson WHERE id = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            Responsibleperson = new Responsibleperson
                            {
                                Id = reader.GetInt32(0),
                                Name = reader.GetString(2),
                            };
                        }
                    }
                }
            }
            if (Responsibleperson == null) return NotFound();
            return Responsibleperson;
        }


        [HttpPost]
        public async Task<ActionResult<Responsibleperson>> PostResponsibleperson(Responsibleperson Responsibleperson)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("INSERT INTO Responsibleperson ( name) OUTPUT INSERTED.id VALUES (@Name)", conn))
                {
                    cmd.Parameters.AddWithValue("@Name", Responsibleperson.Name);
                    Responsibleperson.Id = (int)await cmd.ExecuteScalarAsync();
                }
            }
            return CreatedAtAction(nameof(GetResponsibleperson), new { id = Responsibleperson.Id }, Responsibleperson);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> PutResponsibleperson(int id, Responsibleperson Responsibleperson)
        {
            if (id != Responsibleperson.Id) return BadRequest();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("UPDATE Responsibleperson SET  name = @Name WHERE id = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", Responsibleperson.Id);
                    cmd.Parameters.AddWithValue("@Name", Responsibleperson.Name);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }
            return NoContent();
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResponsibleperson(int id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("DELETE FROM Responsibleperson WHERE id = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", id);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }
            return NoContent();
        }




        public class Responsibleperson
        {
            public int Id { get; set; }
            public string Name { get; set; }
        }
    }

}
