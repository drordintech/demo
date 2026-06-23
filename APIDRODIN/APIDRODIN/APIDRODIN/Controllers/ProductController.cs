using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace APIDRODIN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {

        private readonly string _connectionString;

        public ProductController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpGet("GetProduct")]
      
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            List<Product> products = new List<Product>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT product_id, product_code, name, description, price, stock_quantity, brand_id FROM product", conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            products.Add(new Product
                            {
                                ProductId = reader.GetInt32(0),
                                ProductCode = reader.GetString(1),
                                Name = reader.GetString(2),
                                Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                                Price = reader.GetDecimal(4),
                                StockQuantity = reader.GetInt32(5),
                                BrandId = reader.GetInt32(6)
                            });
                        }
                    }
                }
            }
            return Ok(products);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            Product product = null;
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT product_id, product_code, name, description, price, stock_quantity, brand_id FROM product WHERE product_id = @ProductId", conn))
                {
                    cmd.Parameters.AddWithValue("@ProductId", id);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            product = new Product
                            {
                                ProductId = reader.GetInt32(0),
                                ProductCode = reader.GetString(1),
                                Name = reader.GetString(2),
                                Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                                Price = reader.GetDecimal(4),
                                StockQuantity = reader.GetInt32(5),
                                BrandId = reader.GetInt32(6)
                            };
                        }
                    }
                }
            }
            if (product == null) return NotFound();
            return product;
        }


        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("INSERT INTO product (product_code, name, description, price, stock_quantity, brand_id) OUTPUT INSERTED.product_id VALUES (@ProductCode, @Name, @Description, @Price, @StockQuantity, @BrandId)", conn))
                {
                    cmd.Parameters.AddWithValue("@ProductCode", product.ProductCode);
                    cmd.Parameters.AddWithValue("@Name", product.Name);
                    cmd.Parameters.AddWithValue("@Description", product.Description ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Price", product.Price);
                    cmd.Parameters.AddWithValue("@StockQuantity", product.StockQuantity);
                    cmd.Parameters.AddWithValue("@BrandId",1);
                    product.ProductId = (int)await cmd.ExecuteScalarAsync();
                }
            }
            return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, product);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            if (id != product.ProductId) return BadRequest();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("UPDATE product SET product_code = @ProductCode, name = @Name, description = @Description, price = @Price, stock_quantity = @StockQuantity, brand_id = @BrandId WHERE product_id = @ProductId", conn))
                {
                    cmd.Parameters.AddWithValue("@ProductId", product.ProductId);
                    cmd.Parameters.AddWithValue("@ProductCode", product.ProductCode);
                    cmd.Parameters.AddWithValue("@Name", product.Name);
                    cmd.Parameters.AddWithValue("@Description", product.Description ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Price", product.Price);
                    cmd.Parameters.AddWithValue("@StockQuantity", product.StockQuantity);
                    cmd.Parameters.AddWithValue("@BrandId", product.BrandId);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }
            return NoContent();
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("DELETE FROM product WHERE product_id = @ProductId", conn))
                {
                    cmd.Parameters.AddWithValue("@ProductId", id);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    if (rowsAffected == 0) return NotFound();
                }
            }
            return NoContent();
        }



        [HttpGet("GetBrands")]
        public async Task<ActionResult<IEnumerable<Brand>>> GetBrands()
        {
            List<Brand> Brands = new List<Brand>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT brand_id, brand_name FROM Brand", conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            Brands.Add(new Brand
                            {
                                brand_id = reader.GetInt32(0),
                                brand_name = reader.GetString(1),

                            });
                        }
                    }
                }
            }
            return Ok(Brands);
        }


        public class Brand
        {
            public int brand_id { get; set; }
            public string brand_name { get; set; }
        }

        public class Product
        {
            public int ProductId { get; set; }
            public string ProductCode { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal Price { get; set; }
            public int StockQuantity { get; set; }
            public int BrandId { get; set; }
        }
    }

}
