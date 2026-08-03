using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;
using static APIDRODIN.Controllers.GRNController;
using static APIDRODIN.Controllers.SupplierController;

namespace APIDRODIN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("AllowAll")]
    public class GRNController : ControllerBase
    {
        private readonly string _connectionString;
        public GRNController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpGet("top-rejected-products")]
        public async Task<IActionResult> GetTopRejectedProducts()
        {
            List<object> topProducts = new List<object>();

            string connectionString = _connectionString;
            string query = @"
                                SELECT TOP 10 
                                p.name AS ProductName, 
                                SUM(g.RejectedQuantity) AS TotalRejectedQuantity
                            FROM Drodin.dbo.GRNDetails g
                            INNER JOIN Drodin.dbo.product p ON g.ProductId = p.product_id  
                            GROUP BY g.ProductId, p.name
                            ORDER BY TotalRejectedQuantity DESC;
                            ";

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    using (SqlDataReader reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            topProducts.Add(new
                            {
                                ProductName = reader["ProductName"].ToString(),
                                TotalRejectedQuantity = Convert.ToInt32(reader["TotalRejectedQuantity"])
                            });
                        }
                    }
                }
            }

            return Ok(topProducts);
        }
        [HttpGet("rejectedquantitybystate")]
        public async Task<IActionResult> GetRejectedQuantityByState()
        {
            List<object> stateRejectedData = new List<object>();
            string connectionString = _connectionString;

            string query = @"
                               SELECT s.State, 
                               SUM(gd.RejectedQuantity) AS TotalRejectedQuantity
                        FROM GRNDetails gd
                        INNER JOIN GRN g ON gd.GrnId = g.Id
                        INNER JOIN Supplier s ON g.SupplierId = s.SupplierId
                        GROUP BY s.State
                        ORDER BY TotalRejectedQuantity DESC;";

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    using (SqlDataReader reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            stateRejectedData.Add(new
                            {
                                State = reader["State"].ToString(),
                                TotalRejectedQuantity = Convert.ToInt32(reader["TotalRejectedQuantity"])
                            });
                        }
                    }
                }
            }

            return Ok(stateRejectedData);
        }

        [HttpPost("SaveGRN")]
        public async Task<IActionResult> SaveGRN([FromBody] GRNDto grnDto)
        {
            string connectionString = _connectionString;

            if (grnDto == null)
            {
                return BadRequest(new { message = "Invalid request: GRN data is missing." });
            }
            if (grnDto.SupplierId == 0)
            {
                return BadRequest(new { message = "Supplier ID is required and should be a valid number." });
            }
            if (grnDto.GrnDetails == null || !grnDto.GrnDetails.Any())
            {
                return BadRequest(new { message = "At least one GRN detail entry is required." });
            }

            int grnId = 0; // This will store the inserted GRN ID

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                using (SqlTransaction transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // 1. Insert into GRNs table
                        string insertGRNQuery = @"
                    INSERT INTO GRN (GrnNumber, SupplierId, CreatedAt,ResponsiblePersonId,DockerNumber,GrnStatus,UpdatedDate) 
                    OUTPUT INSERTED.Id
                    VALUES (@GrnNumber, @SupplierId, @CreatedAt,@ResponsiblePersonId,@DockerNumber,@GrnStatus,@UpdatedDate);";

                        using (SqlCommand cmd = new SqlCommand(insertGRNQuery, connection, transaction))
                        {
                            cmd.Parameters.AddWithValue("@GrnNumber", grnDto.GrnNumber);
                            cmd.Parameters.AddWithValue("@SupplierId", grnDto.SupplierId);
                            cmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                            cmd.Parameters.AddWithValue("@UpdatedDate", DateTime.UtcNow);
                            cmd.Parameters.AddWithValue("@ResponsiblePersonId", grnDto.ResponsiblePerson);
                            cmd.Parameters.AddWithValue("@DockerNumber", grnDto.DockerNo);
                            cmd.Parameters.AddWithValue("@GrnStatus", grnDto.Grnstatus);
                            grnId = (int)await cmd.ExecuteScalarAsync(); // Get inserted GRN ID
                        }

                        // 2. Insert into GRNDetails table
                        string insertDetailsQuery = @"
                                                        INSERT INTO GRNDetails 
                                                        (GrnId, ProductId,  QuantityAsPerParty, ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, MRP, BatchNumber, ExpiryDate, Remarks1,
                                                        Remarks2,Demandedbyparty,Approvedbycompany,Rejectedstatus,Passedstatus,ReturnToParty,Quantity) 
                                                        VALUES 
                                                        (@GrnId, @ProductId,  @QuantityAsPerParty, @ReceivedQuantity, @RejectedQuantity, @PassedQuantity, @Status, @Mrp, @BatchNumber, @ExpiryDate, @Remarks1,
                                                        @Remarks2,@Demandedbyparty,@Approvedbycompany,@Rejectedstatus,@Passedstatus,@ReturnToParty,@Quantity);";

                        foreach (var detail in grnDto.GrnDetails)
                        {
                            using (SqlCommand cmd = new SqlCommand(insertDetailsQuery, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@GrnId", grnId);
                                cmd.Parameters.AddWithValue("@ProductId", detail.ProductId);
                                cmd.Parameters.AddWithValue("@QuantityAsPerParty", detail.QuantityAsPerParty);
                                cmd.Parameters.AddWithValue("@ReceivedQuantity", detail.ReceivedQuantity);
                                cmd.Parameters.AddWithValue("@RejectedQuantity", detail.RejectedQuantity);
                                cmd.Parameters.AddWithValue("@PassedQuantity", detail.PassedQuantity);
                                cmd.Parameters.AddWithValue("@Status", detail.Status);
                                cmd.Parameters.AddWithValue("@Mrp", detail.Mrp);
                                cmd.Parameters.AddWithValue("@BatchNumber", (object)detail.BatchNumber ?? DBNull.Value);
                                //cmd.Parameters.AddWithValue("@ExpiryDate", (object)detail.ExpiryDate ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@ExpiryDate", SqlDateOrNull(detail.ExpiryDate));
                                cmd.Parameters.AddWithValue("@Remarks1", (object)detail.Remarks1 ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@Remarks2", (object)detail.Remarks2 ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@Demandedbyparty", detail.Demandedbyparty);
                                cmd.Parameters.AddWithValue("@Rejectedstatus", detail.Rejectedstatus);
                                cmd.Parameters.AddWithValue("@Passedstatus", detail.Passedstatus);
                                cmd.Parameters.AddWithValue("@ReturnToParty", detail.ReturnToParty);
                                cmd.Parameters.AddWithValue("@Quantity", detail.Quantity);
                                cmd.Parameters.AddWithValue("@Approvedbycompany", "YES");

                                await cmd.ExecuteNonQueryAsync();
                            }
                        }

                        // Commit transaction if everything succeeds
                        transaction.Commit();

                        return Ok(new { Message = "GRN saved successfully", GrnId = grnId });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { message = "An error occurred while processing the request.", error = ex.Message });
                    }
                }
            }
        }
        public object SqlDateOrNull(DateTime? date)
        {
            if (date == null || date.Value == DateTime.MinValue)
                return DBNull.Value;
            return date.Value;
        }

        [HttpPost("SaveChallan")]
        public async Task<IActionResult> SaveChallan([FromBody] ChallanDto challanDto)
        {
            string connectionString = _connectionString;

            if (challanDto == null)
            {
                return BadRequest(new { message = "Invalid request: Challan data is missing." });
            }
            if (challanDto.SupplierId == 0)
            {
                return BadRequest(new { message = "Supplier ID is required and should be a valid number." });
            }
            if (challanDto.ChallanDetails == null || !challanDto.ChallanDetails.Any())
            {
                return BadRequest(new { message = "At least one Challan detail entry is required." });
            }

            int challanId = 0;

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                using (SqlTransaction transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Insert into Challan table
                        string insertChallanQuery = @"
                    INSERT INTO Challan (ChallanNumber, SupplierId, CreatedAt,GRNnumber)
                    OUTPUT INSERTED.Id
                    VALUES (@ChallanNumber, @SupplierId, @CreatedAt,@GRNnumber);
                ";

                        using (SqlCommand cmd = new SqlCommand(insertChallanQuery, connection, transaction))
                        {
                            cmd.Parameters.AddWithValue("@ChallanNumber", challanDto.ChallanNumber);
                            cmd.Parameters.AddWithValue("@SupplierId", challanDto.SupplierId);
                            cmd.Parameters.AddWithValue("@GRNnumber", challanDto.GRNNumber);
                            cmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                         
                            challanId = (int)await cmd.ExecuteScalarAsync();
                        }

                        // Insert into ChallanDetails table
                        string insertDetailsQuery = @"
                    INSERT INTO ChallanDetail
                    (ChallanId, ProductId, Quantity, Aproxvalue, Remarks,ChallanNumber)
                    VALUES
                    (@ChallanId, @ProductId, @Quantity, @Aproxvalue, @Remarks,@ChallanNumber);
                ";

                        foreach (var detail in challanDto.ChallanDetails)
                        {
                            using (SqlCommand cmd = new SqlCommand(insertDetailsQuery, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@ChallanId", challanId);
                                cmd.Parameters.AddWithValue("@ProductId", detail.ProductId);
                                cmd.Parameters.AddWithValue("@Quantity", detail.Quantity);
                                cmd.Parameters.AddWithValue("@Aproxvalue", detail.Aproxvalue);
                                cmd.Parameters.AddWithValue("@ChallanNumber", challanDto.ChallanNumber);
                                cmd.Parameters.AddWithValue("@Remarks", (object)detail.Remarks ?? DBNull.Value);
                                await cmd.ExecuteNonQueryAsync();
                            }
                        }

                        transaction.Commit();
                        return Ok(new { Message = "Challan saved successfully", ChallanId = challanId });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { message = "An error occurred while processing the request.", error = ex.Message });
                    }
                }
            }
        }


        [HttpGet("getGrnByDate")]
        public async Task<IActionResult> getGrnByDate([FromQuery] GrnByDateFilterDto filter)
        {
            try
            {
                var reportData = await GetGrnbyDateAsync(filter);
                return Ok(reportData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching GRN report.", error = ex.Message });
            }
        }

        public async Task<IEnumerable<GrnDtos>> GetGrnbyDateAsync(GrnByDateFilterDto filter)
        {
            var grnList = new List<GrnDtos>();
            var connectionString = _connectionString;

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                var query = @"
            SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, s.Name AS SupplierName,p.Name as ResponsiblePerson,g.DockerNumber,g.GrnStatus,c.ChallanNumber
            FROM GRN g
            INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
            LEFT join ResponsiblePerson p on g.ResponsiblePersonId=p.id
            LEFT join Challan c ON g.GrnNumber=c.GRNnumber
            WHERE (@SupplierId IS NULL OR g.SupplierId = @SupplierId)
            AND (@Date IS NULL OR CAST(g.CreatedAt AS DATE) = CAST(@Date AS DATE))";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@SupplierId", (filter.SupplierId.HasValue && filter.SupplierId.Value > 0) ? (object)filter.SupplierId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@Date", (object?)filter.date ?? DBNull.Value);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var grnDto = new GrnDtos
                            {
                                Id = reader.GetInt32(0),
                                GrnNumber = reader.GetString(1),
                                SupplierId = reader.GetInt32(2),
                                CreatedAt = reader.GetDateTime(3),
                                SupplierName = reader.GetString(4),
                                ResponsiblePerson = reader.IsDBNull(5) ? "" : reader.GetString(5),
                                DockerNumber = reader.IsDBNull(6) ? string.Empty : reader.GetString(6),
                                GrnStatus = reader.IsDBNull(7) ? string.Empty : reader.GetString(7),
                                ChallanNumber = reader.IsDBNull(8) ? string.Empty : reader.GetString(8),
                                Grndetails = new List<GRNDetailDto>()
                            };

                            grnList.Add(grnDto);
                        }
                    }
                }

                // Fetch GRN Details
                foreach (var grn in grnList)
                {
                    var detailQuery = @"
                                    SELECT ProductId,   ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, Mrp, BatchNumber, Remarks1, Remarks2, QuantityAsPerParty, 
                                    ExpiryDate,p.name AS ProductName ,Demandedbyparty,Approvedbycompany,Passedstatus       ,Rejectedstatus  ,ReturnToParty      ,Quantity
                                    FROM GrnDetails gd
                                    JOIN product p ON gd.ProductId = p.product_id
                                    WHERE gd.GrnId = @GrnId;";

                    using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                    {
                        detailCmd.Parameters.AddWithValue("@GrnId", grn.Id);

                        using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                        {
                            while (await detailReader.ReadAsync())
                            {
                                var detailDto = new GRNDetailDto
                                {
                                    ProductId = detailReader.GetInt32(0),
                                    ReceivedQuantity = detailReader.IsDBNull(1) ? 0 : detailReader.GetInt32(1),
                                    RejectedQuantity = detailReader.IsDBNull(2) ? 0 : detailReader.GetInt32(2),
                                    PassedQuantity = detailReader.IsDBNull(3) ? 0 : detailReader.GetInt32(3),
                                    Status = detailReader.IsDBNull(4) ? string.Empty : detailReader.GetString(4),
                                    Mrp = detailReader.IsDBNull(5) ? 0 : detailReader.GetDecimal(5),
                                    BatchNumber = detailReader.IsDBNull(6) ? string.Empty : detailReader.GetString(6),
                                    Remarks1 = detailReader.IsDBNull(7) ? string.Empty : detailReader.GetString(7),
                                    Remarks2 = detailReader.IsDBNull(8) ? string.Empty : detailReader.GetString(8),
                                    QuantityAsPerParty = detailReader.IsDBNull(9) ? 0 : detailReader.GetInt32(9),
                                    ExpiryDate = detailReader.IsDBNull(10) ? DateTime.MinValue : detailReader.GetDateTime(10),
                                    ProductName = detailReader.GetString(11),
                                    Demandedbyparty = detailReader.IsDBNull(12) ? string.Empty : detailReader.GetString(12),
                                    Approvedbycompany = detailReader.IsDBNull(13) ? string.Empty : detailReader.GetString(13),
                                    Passedstatus = detailReader.IsDBNull(14) ? string.Empty : detailReader.GetString(14),
                                    Rejectedstatus = detailReader.IsDBNull(15) ? string.Empty : detailReader.GetString(15),
                                    ReturnToParty = !detailReader.IsDBNull(16) && detailReader.GetBoolean(16),
                                    Quantity = detailReader.GetInt32(17),
                                };

                                grn.Grndetails.Add(detailDto);
                            }
                        }
                    }
                }
            }
            return grnList;
        }

        //[HttpPut("updateChallan/{challanId}")]
        //public async Task<IActionResult> updateChallan(int challanId, [FromBody] ChallanDto challanDto)
        //{


        //    return NotFound(new { message = "GRN not found." });
        //}

        [HttpPost("updateChallan/{challanId}")]
        public async Task<IActionResult> UpdateChallan(int challanId, [FromBody] ChallanDto challanDto)
        {
            if (challanDto == null)
                return BadRequest("Invalid data.");

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                SqlTransaction transaction = connection.BeginTransaction();

                try
                {
                    // Check if Challan exists
                    string checkQuery = "SELECT COUNT(*) FROM Challan WHERE ChallanNumber = @ChallanId";
                    using (SqlCommand checkCmd = new SqlCommand(checkQuery, connection, transaction))
                    {
                        checkCmd.Parameters.AddWithValue("@ChallanId", challanId);
                        int count = (int)await checkCmd.ExecuteScalarAsync();
                        if (count == 0)
                            return NotFound(new { message = "Challan not found." });
                    }

                    // Delete previous ChallanDetails
                    string deleteDetailsQuery = "DELETE FROM ChallanDetail WHERE ChallanNumber = @ChallanId";
                    using (SqlCommand deleteCmd = new SqlCommand(deleteDetailsQuery, connection, transaction))
                    {
                        deleteCmd.Parameters.AddWithValue("@ChallanId", challanId);
                        await deleteCmd.ExecuteNonQueryAsync();
                    }

                    // Update Challan
                    string updateChallanQuery = @"UPDATE Challan 
                                               SET ChallanNumber = @ChallanNumber, 
                                                   SupplierId = @SupplierId, 
                                                   GRNnumber = @GRNNumber
                                               WHERE ChallanNumber = @ChallanId";
                    using (SqlCommand updateCmd = new SqlCommand(updateChallanQuery, connection, transaction))
                    {
                        updateCmd.Parameters.AddWithValue("@ChallanId", challanId);
                        updateCmd.Parameters.AddWithValue("@ChallanNumber", challanDto.ChallanNumber);
                        updateCmd.Parameters.AddWithValue("@SupplierId", challanDto.SupplierId);
                        updateCmd.Parameters.AddWithValue("@GRNNumber", (object?)challanDto.GRNNumber ?? DBNull.Value);
                        await updateCmd.ExecuteNonQueryAsync();
                    }

                    // Insert new ChallanDetails
                    string insertDetailQuery = @"INSERT INTO ChallanDetail (ChallanId, ProductId, Quantity, Aproxvalue, Remarks,ChallanNumber) 
                                             VALUES (@ChallanId, @ProductId, @Quantity, @Aproxvalue, @Remarks,@ChallanNumber)";
                    foreach (var detail in challanDto.ChallanDetails)
                    {
                        using (SqlCommand insertCmd = new SqlCommand(insertDetailQuery, connection, transaction))
                        {
                            insertCmd.Parameters.AddWithValue("@ChallanId", challanId);
                            insertCmd.Parameters.AddWithValue("@ProductId", detail.ProductId);
                            insertCmd.Parameters.AddWithValue("@Quantity", detail.Quantity);
                            insertCmd.Parameters.AddWithValue("@Aproxvalue", detail.Aproxvalue);
                            insertCmd.Parameters.AddWithValue("@ChallanNumber", challanDto.ChallanNumber);
                            insertCmd.Parameters.AddWithValue("@Remarks", (object?)detail.Remarks ?? DBNull.Value);
                            await insertCmd.ExecuteNonQueryAsync();
                        }
                    }

                    transaction.Commit();
                    return Ok(new { message = "Challan updated successfully." });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    return StatusCode(500, new { message = ex.Message });
                }
            }
        }


        [HttpPost("UpdateGRN/{grnId}")]
        public async Task<IActionResult> UpdateGRN(int grnId, [FromBody] GRNDto grnDto)
        {
                if (grnDto == null)
            {
                return BadRequest(new { message = "Invalid request: GRN data is missing." });
            }
            if (grnDto.SupplierId == 0)
            {
                return BadRequest(new { message = "Supplier ID is required and should be a valid number." });
            }
            if (grnDto.GrnDetails == null || !grnDto.GrnDetails.Any())
            {
                return BadRequest(new { message = "At least one GRN detail entry is required." });
            }

            string connectionString = _connectionString;

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        // Check if GRN exists
                        string checkGrnQuery = "SELECT COUNT(1) FROM GRN WHERE Id = @GrnId";
                        using (SqlCommand checkCmd = new SqlCommand(checkGrnQuery, conn, transaction))
                        {
                            checkCmd.Parameters.AddWithValue("@GrnId", grnId);
                            int count = (int)await checkCmd.ExecuteScalarAsync();
                            if (count == 0)
                            {
                                return NotFound(new { message = "GRN not found." });
                            }
                        }

                        // Update GRN

                        string updateGrnQuery = @"UPDATE GRN SET GrnNumber = @GrnNumber, SupplierId = @SupplierId, UpdatedDate = @UpdatedDate,
                                                    ResponsiblePersonId=@ResponsiblePersonId,DockerNumber=@DockerNumber,GrnStatus=@GrnStatus
                                                    WHERE Id = @GrnId";
                        using (SqlCommand updateCmd = new SqlCommand(updateGrnQuery, conn, transaction))
                        {
                            updateCmd.Parameters.AddWithValue("@GrnNumber", grnDto.GrnNumber);
                            updateCmd.Parameters.AddWithValue("@SupplierId", grnDto.SupplierId);
                            updateCmd.Parameters.AddWithValue("@ResponsiblePersonId", grnDto.ResponsiblePerson);
                            updateCmd.Parameters.AddWithValue("@DockerNumber", grnDto.DockerNo);
                            updateCmd.Parameters.AddWithValue("@GrnStatus", grnDto.Grnstatus);
                            updateCmd.Parameters.AddWithValue("@UpdatedDate", DateTime.UtcNow);
                            updateCmd.Parameters.AddWithValue("@GrnId", grnId);
                            await updateCmd.ExecuteNonQueryAsync();
                        }

                        // Delete old GRN details
                        string deleteGrnDetailsQuery = "DELETE FROM Grndetails WHERE GrnId = @GrnId";
                        using (SqlCommand deleteCmd = new SqlCommand(deleteGrnDetailsQuery, conn, transaction))
                        {
                            deleteCmd.Parameters.AddWithValue("@GrnId", grnId);
                            await deleteCmd.ExecuteNonQueryAsync();
                        }

                        // Insert new GRN details
                        string insertGrnDetailsQuery = @"INSERT INTO Grndetails (GrnId, ProductId,  QuantityAsPerParty, ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, Mrp, BatchNumber, ExpiryDate, Remarks1, Remarks2,Demandedbyparty,Approvedbycompany,Rejectedstatus,Passedstatus,ReturnToParty,Quantity) 
                                                         VALUES (@GrnId, @ProductId,  @QuantityAsPerParty, @ReceivedQuantity, @RejectedQuantity, @PassedQuantity, @Status, @Mrp, @BatchNumber, @ExpiryDate, @Remarks1, @Remarks2,@Demandedbyparty,@Approvedbycompany,@Rejectedstatus,@Passedstatus,@ReturnToParty,@Quantity)";

                        foreach (var detail in grnDto.GrnDetails)
                        {
                            using (SqlCommand insertCmd = new SqlCommand(insertGrnDetailsQuery, conn, transaction))
                            {
                                insertCmd.Parameters.AddWithValue("@GrnId", grnId);
                                insertCmd.Parameters.AddWithValue("@ProductId", detail.ProductId);

                                insertCmd.Parameters.AddWithValue("@QuantityAsPerParty", detail.QuantityAsPerParty);
                                insertCmd.Parameters.AddWithValue("@ReceivedQuantity", detail.ReceivedQuantity);
                                insertCmd.Parameters.AddWithValue("@RejectedQuantity", detail.RejectedQuantity);
                                insertCmd.Parameters.AddWithValue("@PassedQuantity", detail.PassedQuantity);
                                insertCmd.Parameters.AddWithValue("@Status", detail.Status);
                                insertCmd.Parameters.AddWithValue("@Mrp", detail.Mrp);
                                insertCmd.Parameters.AddWithValue("@BatchNumber", detail.BatchNumber ?? (object)DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@ExpiryDate", SqlDateOrNull(detail.ExpiryDate));
                                insertCmd.Parameters.AddWithValue("@Remarks1", detail.Remarks1 ?? (object)DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@Remarks2", detail.Remarks2 ?? (object)DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@Demandedbyparty", detail.Demandedbyparty);
                                insertCmd.Parameters.AddWithValue("@Approvedbycompany", detail.Approvedbycompany);
                                insertCmd.Parameters.AddWithValue("@Rejectedstatus", detail.Rejectedstatus);
                                insertCmd.Parameters.AddWithValue("@Passedstatus", detail.Passedstatus);
                                insertCmd.Parameters.AddWithValue("@ReturnToParty", detail.ReturnToParty);
                                insertCmd.Parameters.AddWithValue("@Quantity", detail.Quantity);
                                await insertCmd.ExecuteNonQueryAsync();
                            }
                        }

                        // Commit transaction
                        transaction.Commit();
                        return Ok(new { Message = "GRN updated successfully" });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { message = "An error occurred while processing the request.", error = ex.Message });
                    }
                }
            }
        }

        [HttpGet("getGrnReport")]
        public async Task<IActionResult> GetGrnReport([FromQuery] GrnReportFilterDto filter)
        {
            try
            {
                var reportData = await GetGrnReportAsync(filter);
                return Ok(reportData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching GRN report.", error = ex.Message });
            }
        }

        public async Task<IEnumerable<GrnDtos>> GetGrnReportAsync(GrnReportFilterDto filter)
        {
            string connectionString = _connectionString;
            var grnList = new List<GrnDtos>();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                string query = "";
                if (filter.SupplierId == -2)
                {
                    query = @"SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, s.Name AS SupplierName ,g.GrnStatus
                         FROM GRN g
                         INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
                         WHERE (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                         AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)";
                }
                else
                {
                    query = @"SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, s.Name AS SupplierName ,g.GrnStatus
                         FROM GRN g
                         INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
                         WHERE (@SupplierId IS NULL OR g.SupplierId = @SupplierId) 
                         AND (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                         AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)";
                }
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@SupplierId", (object)filter.SupplierId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@DateFrom", (object)filter.dateFrom ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@DateTo", (object)filter.dateTo ?? DBNull.Value);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var grn = new GrnDtos
                            {
                                Id = reader.GetInt32(0),
                                GrnNumber = reader.GetString(1),
                                SupplierId = reader.GetInt32(2),
                                CreatedAt = reader.GetDateTime(3),
                                SupplierName = reader.GetString(4),
                                GrnStatus = reader.GetString(5),
                                Grndetails = new List<GRNDetailDto>()
                            };
                            grnList.Add(grn);
                        }
                    }
                }

                // Fetch GRN details
                foreach (var grn in grnList)
                {
                    string detailQuery = @"
                                    SELECT ProductId, p.name AS ProductName ,  ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, Mrp, BatchNumber, Remarks1, Remarks2,
                                        QuantityAsPerParty, ExpiryDate,Demandedbyparty,Approvedbycompany,Passedstatus,Rejectedstatus,ReturnToParty,Quantity
                                    FROM GrnDetails gd
                                    JOIN product p ON gd.ProductId = p.product_id
                                    WHERE gd.GrnId = @GrnId;";
                    using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                    {
                        detailCmd.Parameters.AddWithValue("@GrnId", grn.Id);
                        using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                        {
                            while (await detailReader.ReadAsync())
                            {
                                grn.Grndetails.Add(new GRNDetailDto
                                {
                                    ProductId = detailReader.GetInt32(0),
                                    ProductName = detailReader.GetString(1),
                                    ReceivedQuantity = detailReader.GetInt32(2),
                                    RejectedQuantity = detailReader.GetInt32(3),
                                    PassedQuantity = detailReader.GetInt32(4),
                                    Status = detailReader.GetString(5),
                                    Mrp = detailReader.GetDecimal(6),
                                    BatchNumber = detailReader.IsDBNull(7) ? null : detailReader.GetString(7),
                                    Remarks1 = detailReader.IsDBNull(8) ? null : detailReader.GetString(8),
                                    Remarks2 = detailReader.IsDBNull(9) ? null : detailReader.GetString(9),
                                    QuantityAsPerParty = detailReader.GetInt32(10),
                                    ExpiryDate = detailReader.IsDBNull(11) ? DateTime.MinValue : detailReader.GetDateTime(11),
                                    Demandedbyparty = detailReader.IsDBNull(12) ? null : detailReader.GetString(12),
                                    Approvedbycompany = detailReader.IsDBNull(13) ? null : detailReader.GetString(13),
                                    Passedstatus = detailReader.IsDBNull(14) ? null : detailReader.GetString(14),
                                    Rejectedstatus = detailReader.IsDBNull(15) ? null : detailReader.GetString(15),
                                    ReturnToParty = !detailReader.IsDBNull(16) && detailReader.GetBoolean(16),
                                  //  Quantity = detailReader.GetInt32(17),
                                });
                            }
                        }
                    }
                }
            }

            return grnList;
        }

        [HttpGet("GetResponsiblePersons")]
        public async Task<IActionResult> GetgrnNumberResponsiblePersons()
        {
            try
            {
                List<object> responsiblePersons = new List<object>();

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = "SELECT Id, Name FROM ResponsiblePerson";

                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            responsiblePersons.Add(new
                            {
                                Id = reader.GetInt32(0),
                                Name = reader.GetString(1)
                            });
                        }
                    }
                }
                return Ok(responsiblePersons);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving data.", error = ex.Message });
            }
        }

        [HttpGet("generateGrnNumber")]
        public async Task<IActionResult> GenerateGrnNumber()
        {
            try
            {
                string connectionString = _connectionString;
                string query = "SELECT TOP 1 GrnNumber FROM GRN ORDER BY CreatedAt DESC";


                string? lastGrnNumber = null;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        object result = await cmd.ExecuteScalarAsync();
                        lastGrnNumber = result?.ToString();
                    }
                }

                // Generate new GRN number
                string newGrnNumber = GenerateNextGrnNumber(lastGrnNumber);
                return Ok(new { GrnNumber = newGrnNumber });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating GRN number.", error = ex.Message });
            }
        }

        [HttpGet("genratechallanNumber")]
        public async Task<IActionResult> genratechallanNumber()
        {
            try
            {
                string connectionString = _connectionString;
                string query = "SELECT TOP 1 ChallanNumber FROM Challan ORDER BY CreatedAt DESC";


                string? lastGrnNumber = null;

                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    await conn.OpenAsync();
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        object result = await cmd.ExecuteScalarAsync();
                        lastGrnNumber = result?.ToString();
                    }
                }

                // Generate new GRN number
                string newGrnNumber = GenerateNextChallanNumber(lastGrnNumber);
                return Ok(new { ChallanNumber = newGrnNumber });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating GRN number.", error = ex.Message });
            }
        }

        private string GenerateNextGrnNumber(string? lastGrnNumber)
        {
            if (string.IsNullOrEmpty(lastGrnNumber))
            {
                return "GRN-1001"; // Start from an initial GRN number
            }

            // Validate the format (GRN-XXXXXXXXXXXXXX)
            if (!lastGrnNumber.StartsWith("GRN-") || !long.TryParse(lastGrnNumber.Substring(4), out long lastNumber))
            {
                throw new Exception("Invalid GRN format.");
            }

            // Increment the number
            long nextNumber = lastNumber + 1;

            // Return the new GRN number
            return $"GRN-{nextNumber}";
        }

        private string GenerateNextChallanNumber(string? lastGrnNumber)
        {
            if (string.IsNullOrEmpty(lastGrnNumber))
            {
                return "1001"; // Start from an initial GRN number
            }

            // Validate the format (GRN-XXXXXXXXXXXXXX)
            if (!long.TryParse(lastGrnNumber, out long lastNumber))
            {
                throw new Exception("Invalid Challan format.");
            }

            // Increment the number
            long nextNumber = lastNumber + 1;

            // Return the new GRN number
            return $"{nextNumber}";
        }



        [HttpGet("getDistinctStates")]
        public async Task<IActionResult> getDistinctStates()
        {
            List<states> statess = new List<states>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT DISTINCT [State] FROM [Drodin].[dbo].[Supplier] WHERE [State] IS NOT NULL AND [State] <> '';", conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            statess.Add(new states
                            {
                                State = reader.GetString(0),
                            });
                        }
                    }
                }
            }

            return Ok(statess);
        }


        [HttpGet("getGrnReportByState")]
        public async Task<IActionResult> getGrnReportByState([FromQuery] GrnStateWiseReportFilterDto filter)
        {
            try
            {
                var reportData = await GetGrnReportAsync(filter);
                return Ok(reportData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching GRN report.", error = ex.Message });
            }
        }
        
        [HttpGet("getGrnReportByResponsiblePerson")]
        public async Task<IActionResult> getGrnReportByResponsiblePerson([FromQuery] GrnResponsiblePersonReportFilterDto filter)
        {
            try
            {
                var reportData = await GetGrnReportAsync(filter);
                return Ok(reportData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching GRN report.", error = ex.Message });
            }
        }

        public async Task<IEnumerable<GrnDtos>> GetGrnReportAsync(GrnResponsiblePersonReportFilterDto filter)
        {
            string connectionString = _connectionString;
            var grnList = new List<GrnDtos>();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                string query = "";
                if (filter.PersonId == "-2")
                {
                    query = @"SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, s.Name AS SupplierName ,g.GrnStatus
                         FROM GRN g
                         INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
                         WHERE (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                         AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)";
                }
                else
                {
                    query = @"SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, s.Name AS SupplierName ,g.GrnStatus
                         FROM GRN g
                         INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
                         WHERE (@ResponsiblePersonId IS NULL OR g.ResponsiblePersonId = @ResponsiblePersonId) 
                         AND (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                         AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)";
                }
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@ResponsiblePersonId", (object)filter.PersonId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@DateFrom", (object)filter.dateFrom ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@DateTo", (object)filter.dateTo ?? DBNull.Value);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var grn = new GrnDtos
                            {
                                Id = reader.GetInt32(0),
                                GrnNumber = reader.GetString(1),
                                SupplierId = reader.GetInt32(2),
                                CreatedAt = reader.GetDateTime(3),
                                SupplierName = reader.GetString(4),
                                GrnStatus = reader.GetString(5),
                                Grndetails = new List<GRNDetailDto>()
                            };
                            grnList.Add(grn);
                        }
                    }
                }

                // Fetch GRN details
                foreach (var grn in grnList)
                {
                    string detailQuery = @"
                                    SELECT ProductId, p.name AS ProductName ,  ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, Mrp, BatchNumber, Remarks1, Remarks2, 
QuantityAsPerParty, ExpiryDate,Demandedbyparty,Approvedbycompany,Passedstatus,Rejectedstatus,ReturnToParty,Quantity
                                    FROM GrnDetails gd
                                    JOIN product p ON gd.ProductId = p.product_id
                                    WHERE gd.GrnId = @GrnId;";
                    using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                    {
                        detailCmd.Parameters.AddWithValue("@GrnId", grn.Id);
                        using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                        {
                            while (await detailReader.ReadAsync())
                            {
                                grn.Grndetails.Add(new GRNDetailDto
                                {
                                    ProductId = detailReader.GetInt32(0),
                                    ProductName = detailReader.GetString(1),
                                    ReceivedQuantity = detailReader.GetInt32(2),
                                    RejectedQuantity = detailReader.GetInt32(3),
                                    PassedQuantity = detailReader.GetInt32(4),
                                    Status = detailReader.GetString(5),
                                    Mrp = detailReader.GetDecimal(6),
                                    BatchNumber = detailReader.IsDBNull(7) ? null : detailReader.GetString(7),
                                    Remarks1 = detailReader.IsDBNull(8) ? null : detailReader.GetString(8),
                                    Remarks2 = detailReader.IsDBNull(9) ? null : detailReader.GetString(9),
                                    QuantityAsPerParty = detailReader.GetInt32(10),
                                    ExpiryDate = detailReader.IsDBNull(11) ? DateTime.MinValue : detailReader.GetDateTime(11),
                                    Demandedbyparty = detailReader.IsDBNull(12) ? null : detailReader.GetString(12),
                                    Approvedbycompany = detailReader.IsDBNull(13) ? null : detailReader.GetString(13),
                                    Passedstatus = detailReader.IsDBNull(14) ? null : detailReader.GetString(14),
                                    Rejectedstatus = detailReader.IsDBNull(15) ? null : detailReader.GetString(15),
                                    ReturnToParty = !detailReader.IsDBNull(16) && detailReader.GetBoolean(16),
                                });
                            }
                        }
                    }
                }
            }

            return grnList;
        }


        public async Task<IEnumerable<GrnDtos>> GetGrnReportAsync(GrnStateWiseReportFilterDto filter)
        {
            string connectionString = _connectionString;
            var grnList = new List<GrnDtos>();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                string query = "";
                if (filter.state == "-2")
                {
                    query = @"SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, s.Name AS SupplierName ,g.GrnStatus
                         FROM GRN g
                         INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
                         WHERE (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                         AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)";
                }
                else
                {
                    query = @"SELECT g.Id, 
                               g.GrnNumber, 
                               g.SupplierId, 
                               g.CreatedAt, 
                               s.Name AS SupplierName,
                               s.State,g.GrnStatus
                        FROM GRN g
                        INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
                        WHERE (@State IS NULL OR s.State = @State) 
                        AND (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                        AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)
                        ";
                }
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@State", (object)filter.state ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@DateFrom", (object)filter.dateFrom ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@DateTo", (object)filter.dateTo ?? DBNull.Value);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var grn = new GrnDtos
                            {
                                Id = reader.GetInt32(0),
                                GrnNumber = reader.GetString(1),
                                SupplierId = reader.GetInt32(2),
                                CreatedAt = reader.GetDateTime(3),
                                SupplierName = reader.GetString(4),
                                GrnStatus = reader.GetString(5),
                                Grndetails = new List<GRNDetailDto>()
                            };
                            grnList.Add(grn);
                        }
                    }
                }

                // Fetch GRN details
                foreach (var grn in grnList)
                {
                    string detailQuery = @"
                                    SELECT ProductId, p.name AS ProductName ,  ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, Mrp,
                                            BatchNumber, Remarks1, Remarks2, QuantityAsPerParty, ExpiryDate,Demandedbyparty,Approvedbycompany,Passedstatus,Rejectedstatus,ReturnToParty,Quantity
                                    FROM GrnDetails gd
                                    JOIN product p ON gd.ProductId = p.product_id
                                    WHERE gd.GrnId = @GrnId;";
                    using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                    {
                        detailCmd.Parameters.AddWithValue("@GrnId", grn.Id);
                        using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                        {
                            while (await detailReader.ReadAsync())
                            {
                                grn.Grndetails.Add(new GRNDetailDto
                                {
                                    ProductId = detailReader.GetInt32(0),
                                    ProductName = detailReader.GetString(1),
                                    ReceivedQuantity = detailReader.GetInt32(2),
                                    RejectedQuantity = detailReader.GetInt32(3),
                                    PassedQuantity = detailReader.GetInt32(4),
                                    Status = detailReader.GetString(5),
                                    Mrp = detailReader.GetDecimal(6),
                                    BatchNumber = detailReader.IsDBNull(7) ? null : detailReader.GetString(7),
                                    Remarks1 = detailReader.IsDBNull(8) ? null : detailReader.GetString(8),
                                    Remarks2 = detailReader.IsDBNull(9) ? null : detailReader.GetString(9),
                                    QuantityAsPerParty = detailReader.GetInt32(10),
                                    ExpiryDate = detailReader.IsDBNull(11) ? DateTime.MinValue : detailReader.GetDateTime(11),
                                    Demandedbyparty = detailReader.IsDBNull(12) ? null : detailReader.GetString(12),
                                    Approvedbycompany = detailReader.IsDBNull(13) ? null : detailReader.GetString(13),
                                    Passedstatus = detailReader.IsDBNull(14) ? null : detailReader.GetString(14),
                                    Rejectedstatus = detailReader.IsDBNull(15) ? null : detailReader.GetString(15),
                                    ReturnToParty = !detailReader.IsDBNull(16) && detailReader.GetBoolean(16),
                                });
                            }
                        }
                    }
                }
            }

            return grnList;
        }

        public class ResponsiblePerson
        {
            public int Id { get; set; }
            public string? Name { get; set; }
        }

        public class states
        {
            public string State { get; set; }
        }
            public class GrnByDateFilterDto
        {
            public int? SupplierId { get; set; }
            public DateTime? date { get; set; }
        }

        public class GrnDtos
        {
            public int Id { get; set; }
            public string GrnNumber { get; set; } = null!;
            public int SupplierId { get; set; }
            public string SupplierName { get; set; } = null!;
            public string ResponsiblePerson { get; set; } = null!;
            public string DockerNumber { get; set; } = null!;
            public string GrnStatus { get; set; } = null!;
            public string ChallanNumber { get; set; } = null!;
            public DateTime? CreatedAt { get; set; }
            public List<GRNDetailDto> Grndetails { get; set; } = new List<GRNDetailDto>();
        }
        public class GrnReportFilterDto
        {
            public int? SupplierId { get; set; }
            public DateTime? dateFrom { get; set; }
            public DateTime? dateTo { get; set; }
        }
        public class GrnStateWiseReportFilterDto
        {
            public string? state { get; set; }
            public DateTime? dateFrom { get; set; }
            public DateTime? dateTo { get; set; }
        }
        public class GrnResponsiblePersonReportFilterDto
        {
            public string? PersonId { get; set; }
            public DateTime? dateFrom { get; set; }
            public DateTime? dateTo { get; set; }
        }
        public class GRNDto
        {
            [Required]
            public string GrnNumber { get; set; }

            public int ResponsiblePerson { get; set; }
            public string DockerNo { get; set; }
            public string Grnstatus { get; set; }

            [Required]
            public int SupplierId { get; set; }
           
            public List<GRNDetailDto> GrnDetails { get; set; }
        }


        public class GRNDetailDto
        {
            [Required]
            public int ProductId { get; set; }

            public string? ProductName { get; set; }


            public int? QuantityAsPerParty { get; set; }

            public int? ReceivedQuantity { get; set; }

            public int? RejectedQuantity { get; set; }

            public int? PassedQuantity { get; set; }

            public string? Status { get; set; }
            public string? Demandedbyparty { get; set; }
            public string? Approvedbycompany { get; set; }


            public decimal? Mrp { get; set; }

            public string? BatchNumber { get; set; }

            public DateTime ExpiryDate { get; set; }

            public string? Remarks1 { get; set; }

            public string? Remarks2 { get; set; }
            public string? Passedstatus { get; set; }
            public string? Rejectedstatus { get; set; }
            public bool ReturnToParty { get; set; }
            public int? Quantity { get; set; }

            public DateTime UpdatedDate { get; set; }
        }

        public class ChallanDto
        {
            [Required]
            public string? ChallanNumber { get; set; }

            public string? GRNNumber { get; set; }

            [Required]
            public int SupplierId { get; set; }

            
            public List<ChallanDetailDto>? ChallanDetails { get; set; }
        }

        public class ChallanDetailDto
        {
            [Required]
            public int ProductId { get; set; }
            public int Quantity { get; set; }
            public string? Remarks { get; set; }
            public int Aproxvalue { get; set; }

        }
    }
}
