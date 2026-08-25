using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace APIDRODIN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LinkSaltManufacturerController : ControllerBase
    {
        private readonly string _connectionString;

        public LinkSaltManufacturerController(IConfiguration configuration)
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
            public bool Checked { get; set; }
        }

        public class Salt
        {
            public int SaltID { get; set; }
            public string Name { get; set; }
        }

        public class SaltStockLocationWise
        {
            public int SaltID { get; set; }
            public string SaltName { get; set; }
            public int LocationID { get; set; }
            public string LocationName { get; set; }
            public decimal StockQuantity { get; set; }
        }

        [HttpGet("fetchManufacturerDetailsbySaltId")]
        public async Task<ActionResult<IEnumerable<Manufacturer>>> FetchManufacturerDetailsBySaltId(int saltId)
        {
            List<Manufacturer> manufacturers = new List<Manufacturer>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT m.ManufacturerID, m.Name, m.Address, m.Email, m.PhoneNumber, m.OtherInformation FROM Manufacturer m INNER JOIN ManufacturerSalt ms ON m.ManufacturerID = ms.ManufacturerID WHERE ms.SaltID = @SaltId", conn))
                {
                    cmd.Parameters.AddWithValue("@SaltId", saltId);
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

        [HttpGet("fetchSaltDetailsbyManufacturer")]
        public async Task<ActionResult<IEnumerable<Salt>>> FetchSaltDetailsByManufacturer(int manufacturerId)
        {
            List<Salt> salts = new List<Salt>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT s.SaltID, s.Name FROM Salt s INNER JOIN ManufacturerSalt ms ON s.SaltID = ms.SaltID WHERE ms.ManufacturerID = @MId", conn))
                {
                    cmd.Parameters.AddWithValue("@MId", manufacturerId);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            salts.Add(new Salt
                            {
                                SaltID = reader.GetInt32(0),
                                Name = reader.IsDBNull(1) ? null : reader.GetString(1)
                            });
                        }
                    }
                }
            }
            return Ok(salts);
        }

        [HttpGet("GetStockBySaltId")]
        public async Task<ActionResult<IEnumerable<SaltStockLocationWise>>> GetStockBySaltId(int saltId)
        {
            List<SaltStockLocationWise> stocks = new List<SaltStockLocationWise>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT ssl.SaltId, s.Name as SaltName, ssl.LocationId, l.LocationName, ssl.StockQuantity 
                    FROM SaltStockByLocation ssl
                    INNER JOIN Salt s ON ssl.SaltId = s.SaltID
                    INNER JOIN Location l ON ssl.LocationId = l.LocationId
                    WHERE ssl.SaltId = @SaltId", conn))
                {
                    cmd.Parameters.AddWithValue("@SaltId", saltId);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            stocks.Add(new SaltStockLocationWise
                            {
                                SaltID = reader.GetInt32(0),
                                SaltName = reader.IsDBNull(1) ? null : reader.GetString(1),
                                LocationID = reader.GetInt32(2),
                                LocationName = reader.IsDBNull(3) ? null : reader.GetString(3),
                                StockQuantity = reader.IsDBNull(4) ? 0 : reader.GetDecimal(4),
                            });
                        }
                    }
                }
            }
            return Ok(stocks);
        }
    }
}
