using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data.SqlClient;

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
            EnsureInvoiceReceiptImageColumnExists();
            EnsureGrnDocumentsTableExists();
        }

        private void EnsureGrnDocumentsTableExists()
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    string query = @"
                        IF OBJECT_ID('GRNDocuments', 'U') IS NULL
                        BEGIN
                            CREATE TABLE GRNDocuments (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                GrnId INT NOT NULL,
                                FileName NVARCHAR(255) NOT NULL,
                                ContentType NVARCHAR(150) NOT NULL,
                                FileContent NVARCHAR(MAX) NOT NULL,
                                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                CONSTRAINT FK_GRNDocuments_GRN FOREIGN KEY (GrnId) REFERENCES GRN(Id) ON DELETE CASCADE
                            );
                        END";
                    using (SqlCommand command = new SqlCommand(query, connection))
                    {
                        command.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error ensuring GRNDocuments table exists: " + ex.Message);
            }
        }

        private void EnsureInvoiceReceiptImageColumnExists()
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    string query = @"
                        IF NOT EXISTS (
                            SELECT * FROM sys.columns 
                            WHERE object_id = OBJECT_ID('GRN') 
                            AND name = 'InvoiceReceiptImage'
                        )
                        BEGIN
                            ALTER TABLE GRN ADD InvoiceReceiptImage NVARCHAR(MAX) NULL;
                        END";
                    using (SqlCommand command = new SqlCommand(query, connection))
                    {
                        command.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error ensuring InvoiceReceiptImage column exists: " + ex.Message);
            }
        }

        [HttpGet("top-rejected-products")]
        public async Task<IActionResult> GetTopRejectedProducts()
        {
            List<object> topProducts = new List<object>();
            string query = @"
                SELECT TOP 10 
                    p.name AS ProductName, 
                    SUM(g.RejectedQuantity) AS TotalRejectedQuantity
                FROM Drodin.dbo.GRNDetails g
                INNER JOIN Drodin.dbo.product p ON g.ProductId = p.product_id  
                GROUP BY g.ProductId, p.name
                ORDER BY TotalRejectedQuantity DESC;";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (SqlCommand command = new SqlCommand(query, connection))
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
            return Ok(topProducts);
        }

        [HttpGet("rejectedquantitybystate")]
        public async Task<IActionResult> GetRejectedQuantityByState()
        {
            List<object> stateRejectedData = new List<object>();
            string query = @"
                SELECT s.State, 
                       SUM(gd.RejectedQuantity) AS TotalRejectedQuantity
                FROM GRNDetails gd
                INNER JOIN GRN g ON gd.GrnId = g.Id
                INNER JOIN Supplier s ON g.SupplierId = s.SupplierID
                GROUP BY s.State
                ORDER BY TotalRejectedQuantity DESC;";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (SqlCommand command = new SqlCommand(query, connection))
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
            return Ok(stateRejectedData);
        }

        [HttpPost("SaveGRN")]
        [RequestSizeLimit(100 * 1024 * 1024)]
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
            if (grnDto.GrnDetails == null || !grnDto.GrnDetails.Any(d => d.ProductId > 0))
            {
                return BadRequest(new { message = "At least one GRN detail entry with a valid product is required." });
            }

            int grnId = 0;
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (SqlTransaction transaction = connection.BeginTransaction())
                {
                    try
                    {
                        string insertGRNQuery = @"
                            INSERT INTO GRN (GrnNumber, SupplierId, CreatedAt, ResponsiblePersonId, DockerNumber, GrnStatus, UpdatedDate, InvoiceReceiptImage) 
                            OUTPUT INSERTED.Id
                            VALUES (@GrnNumber, @SupplierId, @CreatedAt, @ResponsiblePersonId, @DockerNumber, @GrnStatus, @UpdatedDate, @InvoiceReceiptImage);";

                        using (SqlCommand cmd = new SqlCommand(insertGRNQuery, connection, transaction))
                        {
                            cmd.Parameters.AddWithValue("@GrnNumber", grnDto.GrnNumber ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@SupplierId", grnDto.SupplierId);
                            cmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                            cmd.Parameters.AddWithValue("@UpdatedDate", DateTime.UtcNow);
                            cmd.Parameters.AddWithValue("@ResponsiblePersonId", grnDto.ResponsiblePerson > 0 ? (object)grnDto.ResponsiblePerson : DBNull.Value);
                            cmd.Parameters.AddWithValue("@DockerNumber", string.IsNullOrWhiteSpace(grnDto.DockerNo) ? (object)DBNull.Value : grnDto.DockerNo);
                            cmd.Parameters.AddWithValue("@GrnStatus", string.IsNullOrWhiteSpace(grnDto.Grnstatus) ? (object)DBNull.Value : grnDto.Grnstatus);
                            cmd.Parameters.AddWithValue("@InvoiceReceiptImage", string.IsNullOrWhiteSpace(grnDto.InvoiceReceiptImage) ? (object)DBNull.Value : grnDto.InvoiceReceiptImage);
                            grnId = (int)await cmd.ExecuteScalarAsync();
                        }

                        string insertDetailsQuery = @"
                            INSERT INTO GRNDetails 
                            (GrnId, ProductId, QuantityAsPerParty, ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, MRP, BatchNumber, ExpiryDate, Remarks1, Remarks2, Demandedbyparty, Approvedbycompany, Rejectedstatus, Passedstatus, ReturnToParty, Quantity) 
                            VALUES 
                            (@GrnId, @ProductId, @QuantityAsPerParty, @ReceivedQuantity, @RejectedQuantity, @PassedQuantity, @Status, @Mrp, @BatchNumber, @ExpiryDate, @Remarks1, @Remarks2, @Demandedbyparty, @Approvedbycompany, @Rejectedstatus, @Passedstatus, @ReturnToParty, @Quantity);";

                        foreach (var detail in grnDto.GrnDetails.Where(d => d.ProductId > 0))
                        {
                            using (SqlCommand cmd = new SqlCommand(insertDetailsQuery, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@GrnId", grnId);
                                cmd.Parameters.AddWithValue("@ProductId", detail.ProductId);
                                cmd.Parameters.AddWithValue("@QuantityAsPerParty", detail.QuantityAsPerParty ?? 0);
                                cmd.Parameters.AddWithValue("@ReceivedQuantity", detail.ReceivedQuantity ?? 0);
                                cmd.Parameters.AddWithValue("@RejectedQuantity", detail.RejectedQuantity ?? 0);
                                cmd.Parameters.AddWithValue("@PassedQuantity", detail.PassedQuantity ?? 0);
                                cmd.Parameters.AddWithValue("@Status", (object)detail.Status ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@Mrp", (object)detail.Mrp ?? DBNull.Value);
                                cmd.Parameters.AddWithValue("@BatchNumber", string.IsNullOrWhiteSpace(detail.BatchNumber) ? (object)DBNull.Value : detail.BatchNumber);
                                cmd.Parameters.AddWithValue("@ExpiryDate", SqlDateOrNull(detail.ExpiryDate));
                                cmd.Parameters.AddWithValue("@Remarks1", string.IsNullOrWhiteSpace(detail.Remarks1) ? (object)DBNull.Value : detail.Remarks1);
                                cmd.Parameters.AddWithValue("@Remarks2", string.IsNullOrWhiteSpace(detail.Remarks2) ? (object)DBNull.Value : detail.Remarks2);
                                cmd.Parameters.AddWithValue("@Demandedbyparty", string.IsNullOrWhiteSpace(detail.Demandedbyparty) ? (object)DBNull.Value : detail.Demandedbyparty);
                                cmd.Parameters.AddWithValue("@Rejectedstatus", string.IsNullOrWhiteSpace(detail.Rejectedstatus) ? (object)DBNull.Value : detail.Rejectedstatus);
                                cmd.Parameters.AddWithValue("@Passedstatus", string.IsNullOrWhiteSpace(detail.Passedstatus) ? (object)DBNull.Value : detail.Passedstatus);
                                cmd.Parameters.AddWithValue("@ReturnToParty", detail.ReturnToParty);
                                cmd.Parameters.AddWithValue("@Quantity", (object)detail.Quantity ?? 0);
                                cmd.Parameters.AddWithValue("@Approvedbycompany", "YES");

                                await cmd.ExecuteNonQueryAsync();
                            }
                        }

                        await ReplaceGrnDocumentsAsync(connection, transaction, grnId, grnDto.Documents);
                        transaction.Commit();
                        return Ok(new { Message = "GRN saved successfully", GrnId = grnId });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { message = "An error occurred while saving GRN.", error = ex.Message });
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

        public object SqlDateOrNull(string? date)
        {
            if (string.IsNullOrWhiteSpace(date) || date.StartsWith("0001-01-01", StringComparison.Ordinal))
            {
                return DBNull.Value;
            }

            if (DateTime.TryParse(date, out var parsed) && parsed != DateTime.MinValue)
            {
                return parsed;
            }

            return DBNull.Value;
        }

        private static string? ReadExpiryDate(SqlDataReader reader, int index)
        {
            if (reader.IsDBNull(index))
            {
                return null;
            }

            var dt = reader.GetDateTime(index);
            return dt == DateTime.MinValue ? null : dt.ToString("yyyy-MM-dd");
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
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                using (SqlTransaction transaction = connection.BeginTransaction())
                {
                    try
                    {
                        string insertChallanQuery = @"
                            INSERT INTO Challan (ChallanNumber, SupplierId, CreatedAt, GRNnumber)
                            OUTPUT INSERTED.Id
                            VALUES (@ChallanNumber, @SupplierId, @CreatedAt, @GRNnumber);";

                        using (SqlCommand cmd = new SqlCommand(insertChallanQuery, connection, transaction))
                        {
                            cmd.Parameters.AddWithValue("@ChallanNumber", challanDto.ChallanNumber ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@SupplierId", challanDto.SupplierId);
                            cmd.Parameters.AddWithValue("@GRNnumber", (object?)challanDto.GRNNumber ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                            challanId = (int)await cmd.ExecuteScalarAsync();
                        }

                        string insertDetailsQuery = @"
                            INSERT INTO ChallanDetail (ChallanId, ProductId, Quantity, Aproxvalue, Remarks, ChallanNumber)
                            VALUES (@ChallanId, @ProductId, @Quantity, @Aproxvalue, @Remarks, @ChallanNumber);";

                        foreach (var detail in challanDto.ChallanDetails)
                        {
                            using (SqlCommand cmd = new SqlCommand(insertDetailsQuery, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@ChallanId", challanId);
                                cmd.Parameters.AddWithValue("@ProductId", detail.ProductId);
                                cmd.Parameters.AddWithValue("@Quantity", detail.Quantity);
                                cmd.Parameters.AddWithValue("@Aproxvalue", detail.Aproxvalue);
                                cmd.Parameters.AddWithValue("@ChallanNumber", challanDto.ChallanNumber ?? (object)DBNull.Value);
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
                        return StatusCode(500, new { message = "An error occurred while saving Challan.", error = ex.Message });
                    }
                }
            }
        }

        // ==========================================
        // MONTHLY & YEARLY PERIOD SEARCH ENDPOINT
        // ==========================================
        [HttpGet("getGrnByPeriod")]
        public async Task<IActionResult> GetGrnByPeriod([FromQuery] GrnPeriodFilterDto filter)
        {
            try
            {
                int targetYear = filter.Year ?? DateTime.UtcNow.Year;
                DateTime fromDate;
                DateTime toDate;

                if (filter.Month.HasValue && filter.Month.Value >= 1 && filter.Month.Value <= 12)
                {
                    // Monthly Range
                    fromDate = new DateTime(targetYear, filter.Month.Value, 1);
                    toDate = fromDate.AddMonths(1);
                }
                else
                {
                    // Yearly Range
                    fromDate = new DateTime(targetYear, 1, 1);
                    toDate = fromDate.AddYears(1);
                }

                int? parsedSupplierId = (filter.SupplierId.HasValue && filter.SupplierId.Value > 0) ? filter.SupplierId.Value : null;
                var reportData = await ExecuteGrnQueryAsync(fromDate, toDate, parsedSupplierId);
                return Ok(reportData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching monthly/yearly report.", error = ex.Message });
            }
        }

        [HttpGet("getGrnByDate")]
        public async Task<IActionResult> getGrnByDate([FromQuery] GrnByDateFilterDto filter)
        {
            try
            {
                int? parsedSupplierId = (filter.SupplierId.HasValue && filter.SupplierId.Value > 0) ? filter.SupplierId.Value : null;
                var reportData = await ExecuteGrnQueryAsync(filter.dateFrom, filter.dateTo, parsedSupplierId);
                return Ok(reportData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching GRN report.", error = ex.Message });
            }
        }

        private async Task<IActionResult> GetGrnReportLegacy([FromQuery] GrnReportFilterDto filter)
        {
            try
            {
                int? parsedSupplierId = (filter.SupplierId.HasValue && filter.SupplierId.Value > 0) ? filter.SupplierId.Value : null;
                var reportData = await ExecuteGrnQueryAsync(filter.dateFrom, filter.dateTo, parsedSupplierId);
                return Ok(reportData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching GRN report.", error = ex.Message });
            }
        }

        private async Task<IEnumerable<GrnDtos>> ExecuteGrnQueryAsync(DateTime? fromDate, DateTime? toDate, int? supplierId)
        {
            var grnList = new List<GrnDtos>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT 
                        g.Id, 
                        g.GrnNumber, 
                        g.SupplierId, 
                        g.CreatedAt, 
                        ISNULL(s.Name, '') AS SupplierName,
                        ISNULL(p.Name, '') AS ResponsiblePerson,
                        ISNULL(g.DockerNumber, '') AS DockerNumber,
                        ISNULL(g.GrnStatus, '') AS GrnStatus,
                        ISNULL(c.ChallanNumber, '') AS ChallanNumber,
                        ISNULL(g.InvoiceReceiptImage, '') AS InvoiceReceiptImage
                    FROM GRN g
                    LEFT JOIN Supplier s ON g.SupplierId = s.SupplierID
                    LEFT JOIN ResponsiblePerson p ON g.ResponsiblePersonId = p.Id
                    LEFT JOIN Challan c ON g.GrnNumber = c.GRNnumber
                    WHERE (@SupplierId IS NULL OR g.SupplierId = @SupplierId)
                      AND (@FromDate IS NULL OR g.CreatedAt >= @FromDate)
                      AND (@ToDate IS NULL OR g.CreatedAt < @ToDate)
                    ORDER BY g.CreatedAt DESC;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@SupplierId", (object?)supplierId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@FromDate", (object?)fromDate ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ToDate", (object?)toDate ?? DBNull.Value);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            grnList.Add(new GrnDtos
                            {
                                Id = reader.GetInt32(0),
                                GrnNumber = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                                SupplierId = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                                CreatedAt = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3),
                                SupplierName = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                                ResponsiblePerson = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                                DockerNumber = reader.IsDBNull(6) ? string.Empty : reader.GetString(6),
                                GrnStatus = reader.IsDBNull(7) ? string.Empty : reader.GetString(7),
                                ChallanNumber = reader.IsDBNull(8) ? string.Empty : reader.GetString(8),
                                InvoiceReceiptImage = reader.IsDBNull(9) ? string.Empty : reader.GetString(9),
                                Grndetails = new List<GRNDetailDto>()
                            });
                        }
                    }
                }

                if (grnList.Count > 0)
                {
                    var grnMap = grnList.ToDictionary(g => g.Id);
                    var grnIds = grnList.Select(g => g.Id).ToList();
                    const int chunkSize = 1000;

                    for (int i = 0; i < grnIds.Count; i += chunkSize)
                    {
                        var chunk = grnIds.Skip(i).Take(chunkSize).ToList();
                        var parameterNames = chunk.Select((id, index) => $"@GrnId{index}").ToList();

                        string detailQuery = $@"
                            SELECT 
                                gd.GrnId, 
                                gd.ProductId, 
                                ISNULL(p.name, '') AS ProductName,
                                ISNULL(gd.ReceivedQuantity, 0) AS ReceivedQuantity,
                                ISNULL(gd.RejectedQuantity, 0) AS RejectedQuantity,
                                ISNULL(gd.PassedQuantity, 0) AS PassedQuantity,
                                ISNULL(gd.Status, '') AS Status,
                                ISNULL(gd.Mrp, 0) AS Mrp,
                                gd.BatchNumber,
                                gd.Remarks1,
                                gd.Remarks2,
                                ISNULL(gd.QuantityAsPerParty, 0) AS QuantityAsPerParty,
                                gd.ExpiryDate,
                                gd.Demandedbyparty,
                                gd.Approvedbycompany,
                                gd.Passedstatus,
                                gd.Rejectedstatus,
                                ISNULL(gd.ReturnToParty, 0) AS ReturnToParty,
                                ISNULL(gd.Quantity, 0) AS Quantity
                            FROM GRNDetails gd
                            LEFT JOIN product p ON gd.ProductId = p.product_id
                            WHERE gd.GrnId IN ({string.Join(",", parameterNames)});";

                        using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                        {
                            for (int j = 0; j < chunk.Count; j++)
                            {
                                detailCmd.Parameters.AddWithValue($"@GrnId{j}", chunk[j]);
                            }

                            using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                            {
                                while (await detailReader.ReadAsync())
                                {
                                    int grnId = detailReader.GetInt32(0);
                                    var detailDto = new GRNDetailDto
                                    {
                                        ProductId = detailReader.GetInt32(1),
                                        ReceivedQuantity = detailReader.IsDBNull(2) ? 0 : detailReader.GetInt32(2),
                                        RejectedQuantity = detailReader.IsDBNull(3) ? 0 : detailReader.GetInt32(3),
                                        PassedQuantity = detailReader.IsDBNull(4) ? 0 : detailReader.GetInt32(4),
                                        Status = detailReader.IsDBNull(5) ? string.Empty : detailReader.GetString(5),
                                        Mrp = detailReader.IsDBNull(6) ? 0 : detailReader.GetDecimal(6),
                                        BatchNumber = detailReader.IsDBNull(7) ? string.Empty : detailReader.GetString(7),
                                        Remarks1 = detailReader.IsDBNull(8) ? string.Empty : detailReader.GetString(8),
                                        Remarks2 = detailReader.IsDBNull(9) ? string.Empty : detailReader.GetString(9),
                                        QuantityAsPerParty = detailReader.IsDBNull(10) ? 0 : detailReader.GetInt32(10),
                                        ExpiryDate = ReadExpiryDate(detailReader, 11),
                                        ProductName = detailReader.GetString(12),
                                        Demandedbyparty = detailReader.IsDBNull(13) ? string.Empty : detailReader.GetString(13),
                                        Approvedbycompany = detailReader.IsDBNull(14) ? string.Empty : detailReader.GetString(14),
                                        Passedstatus = detailReader.IsDBNull(15) ? string.Empty : detailReader.GetString(15),
                                        Rejectedstatus = detailReader.IsDBNull(16) ? string.Empty : detailReader.GetString(16),
                                        ReturnToParty = !detailReader.IsDBNull(17) && detailReader.GetBoolean(17),
                                        Quantity = detailReader.GetInt32(18),
                                    };

                                    if (grnMap.TryGetValue(grnId, out var grn))
                                    {
                                        grn.Grndetails.Add(detailDto);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return grnList;
        }

        [HttpPost("updateChallan/{challanId}")]
        public async Task<IActionResult> UpdateChallan(int challanId, [FromBody] ChallanDto challanDto)
        {
            if (challanDto == null) return BadRequest("Invalid data.");

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                SqlTransaction transaction = connection.BeginTransaction();
                try
                {
                    string checkQuery = "SELECT COUNT(*) FROM Challan WHERE ChallanNumber = @ChallanId";
                    using (SqlCommand checkCmd = new SqlCommand(checkQuery, connection, transaction))
                    {
                        checkCmd.Parameters.AddWithValue("@ChallanId", challanId);
                        int count = (int)await checkCmd.ExecuteScalarAsync();
                        if (count == 0) return NotFound(new { message = "Challan not found." });
                    }

                    string deleteDetailsQuery = "DELETE FROM ChallanDetail WHERE ChallanNumber = @ChallanId";
                    using (SqlCommand deleteCmd = new SqlCommand(deleteDetailsQuery, connection, transaction))
                    {
                        deleteCmd.Parameters.AddWithValue("@ChallanId", challanId);
                        await deleteCmd.ExecuteNonQueryAsync();
                    }

                    string updateChallanQuery = @"UPDATE Challan 
                                                 SET ChallanNumber = @ChallanNumber, 
                                                     SupplierId = @SupplierId, 
                                                     GRNnumber = @GRNNumber
                                                 WHERE ChallanNumber = @ChallanId";
                    using (SqlCommand updateCmd = new SqlCommand(updateChallanQuery, connection, transaction))
                    {
                        updateCmd.Parameters.AddWithValue("@ChallanId", challanId);
                        updateCmd.Parameters.AddWithValue("@ChallanNumber", (object?)challanDto.ChallanNumber ?? DBNull.Value);
                        updateCmd.Parameters.AddWithValue("@SupplierId", challanDto.SupplierId);
                        updateCmd.Parameters.AddWithValue("@GRNNumber", (object?)challanDto.GRNNumber ?? DBNull.Value);
                        await updateCmd.ExecuteNonQueryAsync();
                    }

                    string insertDetailQuery = @"INSERT INTO ChallanDetail (ChallanId, ProductId, Quantity, Aproxvalue, Remarks, ChallanNumber) 
                                                 VALUES (@ChallanId, @ProductId, @Quantity, @Aproxvalue, @Remarks, @ChallanNumber)";
                    if (challanDto.ChallanDetails != null)
                    {
                        foreach (var detail in challanDto.ChallanDetails)
                        {
                            using (SqlCommand insertCmd = new SqlCommand(insertDetailQuery, connection, transaction))
                            {
                                insertCmd.Parameters.AddWithValue("@ChallanId", challanId);
                                insertCmd.Parameters.AddWithValue("@ProductId", detail.ProductId);
                                insertCmd.Parameters.AddWithValue("@Quantity", detail.Quantity);
                                insertCmd.Parameters.AddWithValue("@Aproxvalue", detail.Aproxvalue);
                                insertCmd.Parameters.AddWithValue("@ChallanNumber", (object?)challanDto.ChallanNumber ?? DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@Remarks", (object?)detail.Remarks ?? DBNull.Value);
                                await insertCmd.ExecuteNonQueryAsync();
                            }
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
            if (grnDto == null) return BadRequest(new { message = "Invalid request: GRN data is missing." });
            if (grnDto.SupplierId == 0) return BadRequest(new { message = "Supplier ID is required." });
            if (grnDto.GrnDetails == null || !grnDto.GrnDetails.Any()) return BadRequest(new { message = "At least one GRN detail entry is required." });

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        string checkGrnQuery = "SELECT COUNT(1) FROM GRN WHERE Id = @GrnId";
                        using (SqlCommand checkCmd = new SqlCommand(checkGrnQuery, conn, transaction))
                        {
                            checkCmd.Parameters.AddWithValue("@GrnId", grnId);
                            int count = (int)await checkCmd.ExecuteScalarAsync();
                            if (count == 0) return NotFound(new { message = "GRN not found." });
                        }

                        string updateGrnQuery = @"UPDATE GRN SET GrnNumber = @GrnNumber, SupplierId = @SupplierId, UpdatedDate = @UpdatedDate,
                                                    ResponsiblePersonId=@ResponsiblePersonId, DockerNumber=@DockerNumber, GrnStatus=@GrnStatus, InvoiceReceiptImage=@InvoiceReceiptImage
                                                    WHERE Id = @GrnId";
                        using (SqlCommand updateCmd = new SqlCommand(updateGrnQuery, conn, transaction))
                        {
                            updateCmd.Parameters.AddWithValue("@GrnNumber", (object?)grnDto.GrnNumber ?? DBNull.Value);
                            updateCmd.Parameters.AddWithValue("@SupplierId", grnDto.SupplierId);
                            updateCmd.Parameters.AddWithValue("@ResponsiblePersonId", grnDto.ResponsiblePerson > 0 ? (object)grnDto.ResponsiblePerson : DBNull.Value);
                            updateCmd.Parameters.AddWithValue("@DockerNumber", string.IsNullOrWhiteSpace(grnDto.DockerNo) ? (object)DBNull.Value : grnDto.DockerNo);
                            updateCmd.Parameters.AddWithValue("@GrnStatus", string.IsNullOrWhiteSpace(grnDto.Grnstatus) ? (object)DBNull.Value : grnDto.Grnstatus);
                            updateCmd.Parameters.AddWithValue("@InvoiceReceiptImage", string.IsNullOrWhiteSpace(grnDto.InvoiceReceiptImage) ? (object)DBNull.Value : grnDto.InvoiceReceiptImage);
                            updateCmd.Parameters.AddWithValue("@UpdatedDate", DateTime.UtcNow);
                            updateCmd.Parameters.AddWithValue("@GrnId", grnId);
                            await updateCmd.ExecuteNonQueryAsync();
                        }

                        string deleteGrnDetailsQuery = "DELETE FROM Grndetails WHERE GrnId = @GrnId";
                        using (SqlCommand deleteCmd = new SqlCommand(deleteGrnDetailsQuery, conn, transaction))
                        {
                            deleteCmd.Parameters.AddWithValue("@GrnId", grnId);
                            await deleteCmd.ExecuteNonQueryAsync();
                        }

                        string insertGrnDetailsQuery = @"INSERT INTO Grndetails (GrnId, ProductId, QuantityAsPerParty, ReceivedQuantity, RejectedQuantity, PassedQuantity, Status, Mrp, BatchNumber, ExpiryDate, Remarks1, Remarks2, Demandedbyparty, Approvedbycompany, Rejectedstatus, Passedstatus, ReturnToParty, Quantity) 
                                                         VALUES (@GrnId, @ProductId, @QuantityAsPerParty, @ReceivedQuantity, @RejectedQuantity, @PassedQuantity, @Status, @Mrp, @BatchNumber, @ExpiryDate, @Remarks1, @Remarks2, @Demandedbyparty, @Approvedbycompany, @Rejectedstatus, @Passedstatus, @ReturnToParty, @Quantity)";

                        foreach (var detail in (grnDto.GrnDetails ?? new List<GRNDetailDto>()).Where(d => d.ProductId > 0))
                        {
                            using (SqlCommand insertCmd = new SqlCommand(insertGrnDetailsQuery, conn, transaction))
                            {
                                insertCmd.Parameters.AddWithValue("@GrnId", grnId);
                                insertCmd.Parameters.AddWithValue("@ProductId", detail.ProductId);
                                insertCmd.Parameters.AddWithValue("@QuantityAsPerParty", detail.QuantityAsPerParty ?? 0);
                                insertCmd.Parameters.AddWithValue("@ReceivedQuantity", detail.ReceivedQuantity ?? 0);
                                insertCmd.Parameters.AddWithValue("@RejectedQuantity", detail.RejectedQuantity ?? 0);
                                insertCmd.Parameters.AddWithValue("@PassedQuantity", detail.PassedQuantity ?? 0);
                                insertCmd.Parameters.AddWithValue("@Status", (object?)detail.Status ?? DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@Mrp", (object?)detail.Mrp ?? DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@BatchNumber", string.IsNullOrWhiteSpace(detail.BatchNumber) ? (object)DBNull.Value : detail.BatchNumber);
                                insertCmd.Parameters.AddWithValue("@ExpiryDate", SqlDateOrNull(detail.ExpiryDate));
                                insertCmd.Parameters.AddWithValue("@Remarks1", string.IsNullOrWhiteSpace(detail.Remarks1) ? (object)DBNull.Value : detail.Remarks1);
                                insertCmd.Parameters.AddWithValue("@Remarks2", string.IsNullOrWhiteSpace(detail.Remarks2) ? (object)DBNull.Value : detail.Remarks2);
                                insertCmd.Parameters.AddWithValue("@Demandedbyparty", (object?)detail.Demandedbyparty ?? DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@Approvedbycompany", (object?)detail.Approvedbycompany ?? DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@Rejectedstatus", (object?)detail.Rejectedstatus ?? DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@Passedstatus", (object?)detail.Passedstatus ?? DBNull.Value);
                                insertCmd.Parameters.AddWithValue("@ReturnToParty", detail.ReturnToParty);
                                insertCmd.Parameters.AddWithValue("@Quantity", (object?)detail.Quantity ?? 0);
                                await insertCmd.ExecuteNonQueryAsync();
                            }
                        }

                        await ReplaceGrnDocumentsAsync(conn, transaction, grnId, grnDto.Documents);
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

        private static async Task ReplaceGrnDocumentsAsync(SqlConnection connection, SqlTransaction transaction, int grnId, List<GRNDocumentDto>? documents)
        {
            using (SqlCommand deleteCmd = new SqlCommand("DELETE FROM GRNDocuments WHERE GrnId = @GrnId", connection, transaction))
            {
                deleteCmd.Parameters.AddWithValue("@GrnId", grnId);
                await deleteCmd.ExecuteNonQueryAsync();
            }

            if (documents == null) return;
            const string insertQuery = "INSERT INTO GRNDocuments (GrnId, FileName, ContentType, FileContent) VALUES (@GrnId, @FileName, @ContentType, @FileContent)";
            foreach (var document in documents.Where(d => !string.IsNullOrWhiteSpace(d.FileContent)))
            {
                using (SqlCommand insertCmd = new SqlCommand(insertQuery, connection, transaction))
                {
                    insertCmd.Parameters.AddWithValue("@GrnId", grnId);
                    insertCmd.Parameters.AddWithValue("@FileName", document.FileName ?? "document");
                    insertCmd.Parameters.AddWithValue("@ContentType", document.ContentType ?? "application/octet-stream");
                    insertCmd.Parameters.AddWithValue("@FileContent", document.FileContent);
                    await insertCmd.ExecuteNonQueryAsync();
                }
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
                if (grnList.Count > 0)
                {
                    var grnMap = grnList.ToDictionary(g => g.Id);
                    var grnIds = grnList.Select(g => g.Id).ToList();
                    const int chunkSize = 1000;

                    for (int i = 0; i < grnIds.Count; i += chunkSize)
                    {
                        var chunk = grnIds.Skip(i).Take(chunkSize).ToList();
                        var parameterNames = chunk.Select((id, index) => $"@GrnId{index}").ToList();
                        string detailQuery = $@"
                                    SELECT gd.GrnId, gd.ProductId, p.name AS ProductName ,  gd.ReceivedQuantity, gd.RejectedQuantity, gd.PassedQuantity, gd.Status, gd.Mrp, gd.BatchNumber, gd.Remarks1, gd.Remarks2,
                                        gd.QuantityAsPerParty, gd.ExpiryDate, gd.Demandedbyparty, gd.Approvedbycompany, gd.Passedstatus, gd.Rejectedstatus, gd.ReturnToParty
                                    FROM GrnDetails gd
                                    JOIN product p ON gd.ProductId = p.product_id
                                    WHERE gd.GrnId IN ({string.Join(",", parameterNames)});";

                        using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                        {
                            for (int j = 0; j < chunk.Count; j++)
                            {
                                detailCmd.Parameters.AddWithValue($"@GrnId{j}", chunk[j]);
                            }

                            using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                            {
                                while (await detailReader.ReadAsync())
                                {
                                    int grnId = detailReader.GetInt32(0);
                                    var detailDto = new GRNDetailDto
                                    {
                                        ProductId = detailReader.GetInt32(1),
                                        ProductName = detailReader.GetString(2),
                                        ReceivedQuantity = detailReader.GetInt32(3),
                                        RejectedQuantity = detailReader.GetInt32(4),
                                        PassedQuantity = detailReader.GetInt32(5),
                                        Status = detailReader.GetString(6),
                                        Mrp = detailReader.GetDecimal(7),
                                        BatchNumber = detailReader.IsDBNull(8) ? null : detailReader.GetString(8),
                                        Remarks1 = detailReader.IsDBNull(9) ? null : detailReader.GetString(9),
                                        Remarks2 = detailReader.IsDBNull(10) ? null : detailReader.GetString(10),
                                        QuantityAsPerParty = detailReader.GetInt32(11),
                                        ExpiryDate = ReadExpiryDate(detailReader, 12),
                                        Demandedbyparty = detailReader.IsDBNull(13) ? null : detailReader.GetString(13),
                                        Approvedbycompany = detailReader.IsDBNull(14) ? null : detailReader.GetString(14),
                                        Passedstatus = detailReader.IsDBNull(15) ? null : detailReader.GetString(15),
                                        Rejectedstatus = detailReader.IsDBNull(16) ? null : detailReader.GetString(16),
                                        ReturnToParty = !detailReader.IsDBNull(17) && detailReader.GetBoolean(17),
                                    };

                                    if (grnMap.TryGetValue(grnId, out var grn))
                                    {
                                        grn.Grndetails.Add(detailDto);
                                    }
                                }
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
                string? lastGrnNumber = null;
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = "SELECT TOP 1 GrnNumber FROM GRN ORDER BY CreatedAt DESC";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        object result = await cmd.ExecuteScalarAsync();
                        lastGrnNumber = result?.ToString();
                    }
                }

                string newGrnNumber = GenerateNextGrnNumber(lastGrnNumber);
                return Ok(new { GrnNumber = newGrnNumber });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating GRN number.", error = ex.Message });
            }
        }

        [HttpGet("genratechallanNumber")]
        public async Task<IActionResult> GenratechallanNumber()
        {
            try
            {
                string? lastGrnNumber = null;
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = "SELECT TOP 1 ChallanNumber FROM Challan ORDER BY CreatedAt DESC";
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        object result = await cmd.ExecuteScalarAsync();
                        lastGrnNumber = result?.ToString();
                    }
                }

                string newGrnNumber = GenerateNextChallanNumber(lastGrnNumber);
                return Ok(new { ChallanNumber = newGrnNumber });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while generating Challan number.", error = ex.Message });
            }
        }

        private string GenerateNextGrnNumber(string? lastGrnNumber)
        {
            if (string.IsNullOrEmpty(lastGrnNumber)) return "GRN-1001";
            if (!lastGrnNumber.StartsWith("GRN-") || !long.TryParse(lastGrnNumber.Substring(4), out long lastNumber))
            {
                throw new Exception("Invalid GRN format.");
            }
            return $"GRN-{lastNumber + 1}";
        }

        private string GenerateNextChallanNumber(string? lastGrnNumber)
        {
            if (string.IsNullOrEmpty(lastGrnNumber)) return "1001";
            if (!long.TryParse(lastGrnNumber, out long lastNumber))
            {
                throw new Exception("Invalid Challan format.");
            }
            return $"{lastNumber + 1}";
        }

        [HttpGet("getDistinctStates")]
        public async Task<IActionResult> GetDistinctStates()
        {
            List<states> statess = new List<states>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand("SELECT DISTINCT [State] FROM [Drodin].[dbo].[Supplier] WHERE [State] IS NOT NULL AND [State] <> '';", conn))
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
            return Ok(statess);
        }

        [HttpGet("getGrnReportByState")]
        public async Task<IActionResult> GetGrnReportByState([FromQuery] GrnStateWiseReportFilterDto filter)
        {
            var grnList = new List<GrnDtos>();
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = @"SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, ISNULL(s.Name, '') AS SupplierName, ISNULL(g.GrnStatus, '') AS GrnStatus
                                     FROM GRN g
                                     LEFT JOIN Supplier s ON g.SupplierId = s.SupplierID
                                     WHERE (@State IS NULL OR @State = '-2' OR s.State = @State) 
                                       AND (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                                       AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)
                                     ORDER BY g.CreatedAt DESC;";

                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@State", (object?)filter.state ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@DateFrom", (object?)filter.dateFrom ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@DateTo", (object?)filter.dateTo ?? DBNull.Value);

                        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                grnList.Add(new GrnDtos
                                {
                                    Id = reader.GetInt32(0),
                                    GrnNumber = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                                    SupplierId = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                                    CreatedAt = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3),
                                    SupplierName = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                                    GrnStatus = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                                    Grndetails = new List<GRNDetailDto>()
                                });
                            }
                        }
                    }
                // Fetch GRN details
                if (grnList.Count > 0)
                {
                    var grnMap = grnList.ToDictionary(g => g.Id);
                    var grnIds = grnList.Select(g => g.Id).ToList();
                    const int chunkSize = 1000;

                    for (int i = 0; i < grnIds.Count; i += chunkSize)
                    {
                        var chunk = grnIds.Skip(i).Take(chunkSize).ToList();
                        var parameterNames = chunk.Select((id, index) => $"@GrnId{index}").ToList();
                        string detailQuery = $@"
                                    SELECT gd.GrnId, gd.ProductId, p.name AS ProductName ,  gd.ReceivedQuantity, gd.RejectedQuantity, gd.PassedQuantity, gd.Status, gd.Mrp, gd.BatchNumber, gd.Remarks1, gd.Remarks2, 
                                        gd.QuantityAsPerParty, gd.ExpiryDate, gd.Demandedbyparty, gd.Approvedbycompany, gd.Passedstatus, gd.Rejectedstatus, gd.ReturnToParty
                                    FROM GrnDetails gd
                                    JOIN product p ON gd.ProductId = p.product_id
                                    WHERE gd.GrnId IN ({string.Join(",", parameterNames)});";

                        using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                        {
                            for (int j = 0; j < chunk.Count; j++)
                            {
                                detailCmd.Parameters.AddWithValue($"@GrnId{j}", chunk[j]);
                            }

                            using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                            {
                                while (await detailReader.ReadAsync())
                                {
                                    int grnId = detailReader.GetInt32(0);
                                    var detailDto = new GRNDetailDto
                                    {
                                        ProductId = detailReader.GetInt32(1),
                                        ProductName = detailReader.GetString(2),
                                        ReceivedQuantity = detailReader.GetInt32(3),
                                        RejectedQuantity = detailReader.GetInt32(4),
                                        PassedQuantity = detailReader.GetInt32(5),
                                        Status = detailReader.GetString(6),
                                        Mrp = detailReader.GetDecimal(7),
                                        BatchNumber = detailReader.IsDBNull(8) ? null : detailReader.GetString(8),
                                        Remarks1 = detailReader.IsDBNull(9) ? null : detailReader.GetString(9),
                                        Remarks2 = detailReader.IsDBNull(10) ? null : detailReader.GetString(10),
                                        QuantityAsPerParty = detailReader.GetInt32(11),
                                        ExpiryDate = ReadExpiryDate(detailReader, 12),
                                        Demandedbyparty = detailReader.IsDBNull(13) ? null : detailReader.GetString(13),
                                        Approvedbycompany = detailReader.IsDBNull(14) ? null : detailReader.GetString(14),
                                        Passedstatus = detailReader.IsDBNull(15) ? null : detailReader.GetString(15),
                                        Rejectedstatus = detailReader.IsDBNull(16) ? null : detailReader.GetString(16),
                                        ReturnToParty = !detailReader.IsDBNull(17) && detailReader.GetBoolean(17),
                                    };

                                    if (grnMap.TryGetValue(grnId, out var grn))
                                    {
                                        grn.Grndetails.Add(detailDto);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching GRN report by state.", error = ex.Message });
            }

            return Ok(grnList);
        }


        public async Task<IEnumerable<GrnDtos>> GetGrnReportAsync(GrnResponsiblePersonReportFilterDto filter)
        {
                var grnList = new List<GrnDtos>();
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();
                    string query = @"SELECT g.Id, g.GrnNumber, g.SupplierId, g.CreatedAt, ISNULL(s.Name, '') AS SupplierName, ISNULL(g.GrnStatus, '') AS GrnStatus
                                     FROM GRN g
                                     LEFT JOIN Supplier s ON g.SupplierId = s.SupplierID
                                     WHERE (@ResponsiblePersonId IS NULL OR @ResponsiblePersonId = '-2' OR g.ResponsiblePersonId = CAST(@ResponsiblePersonId AS INT)) 
                                       AND (@DateFrom IS NULL OR g.CreatedAt >= @DateFrom) 
                                       AND (@DateTo IS NULL OR CAST(g.CreatedAt AS DATE) <= @DateTo)
                                     ORDER BY g.CreatedAt DESC;";

                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@ResponsiblePersonId", (object?)filter.PersonId ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@DateFrom", (object?)filter.dateFrom ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@DateTo", (object?)filter.dateTo ?? DBNull.Value);

                        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                grnList.Add(new GrnDtos
                                {
                                    Id = reader.GetInt32(0),
                                    GrnNumber = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                                    SupplierId = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                                    CreatedAt = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3),
                                    SupplierName = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                                    GrnStatus = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                                    Grndetails = new List<GRNDetailDto>()
                                });
                            }
                        }
                    }
                // Fetch GRN details
                if (grnList.Count > 0)
                {
                    var grnMap = grnList.ToDictionary(g => g.Id);
                    var grnIds = grnList.Select(g => g.Id).ToList();
                    const int chunkSize = 1000;

                    for (int i = 0; i < grnIds.Count; i += chunkSize)
                    {
                        var chunk = grnIds.Skip(i).Take(chunkSize).ToList();
                        var parameterNames = chunk.Select((id, index) => $"@GrnId{index}").ToList();
                        string detailQuery = $@"
                                    SELECT gd.GrnId, gd.ProductId, p.name AS ProductName ,  gd.ReceivedQuantity, gd.RejectedQuantity, gd.PassedQuantity, gd.Status, gd.Mrp,
                                            gd.BatchNumber, gd.Remarks1, gd.Remarks2, gd.QuantityAsPerParty, gd.ExpiryDate, gd.Demandedbyparty, gd.Approvedbycompany, gd.Passedstatus, gd.Rejectedstatus, gd.ReturnToParty
                                    FROM GrnDetails gd
                                    JOIN product p ON gd.ProductId = p.product_id
                                    WHERE gd.GrnId IN ({string.Join(",", parameterNames)});";

                        using (SqlCommand detailCmd = new SqlCommand(detailQuery, conn))
                        {
                            for (int j = 0; j < chunk.Count; j++)
                            {
                                detailCmd.Parameters.AddWithValue($"@GrnId{j}", chunk[j]);
                            }

                            using (SqlDataReader detailReader = await detailCmd.ExecuteReaderAsync())
                            {
                                while (await detailReader.ReadAsync())
                                {
                                    int grnId = detailReader.GetInt32(0);
                                    var detailDto = new GRNDetailDto
                                    {
                                        ProductId = detailReader.GetInt32(1),
                                        ProductName = detailReader.GetString(2),
                                        ReceivedQuantity = detailReader.GetInt32(3),
                                        RejectedQuantity = detailReader.GetInt32(4),
                                        PassedQuantity = detailReader.GetInt32(5),
                                        Status = detailReader.GetString(6),
                                        Mrp = detailReader.GetDecimal(7),
                                        BatchNumber = detailReader.IsDBNull(8) ? null : detailReader.GetString(8),
                                        Remarks1 = detailReader.IsDBNull(9) ? null : detailReader.GetString(9),
                                        Remarks2 = detailReader.IsDBNull(10) ? null : detailReader.GetString(10),
                                        QuantityAsPerParty = detailReader.GetInt32(11),
                                        ExpiryDate = ReadExpiryDate(detailReader, 12),
                                        Demandedbyparty = detailReader.IsDBNull(13) ? null : detailReader.GetString(13),
                                        Approvedbycompany = detailReader.IsDBNull(14) ? null : detailReader.GetString(14),
                                        Passedstatus = detailReader.IsDBNull(15) ? null : detailReader.GetString(15),
                                        Rejectedstatus = detailReader.IsDBNull(16) ? null : detailReader.GetString(16),
                                        ReturnToParty = !detailReader.IsDBNull(17) && detailReader.GetBoolean(17),
                                    };

                                    if (grnMap.TryGetValue(grnId, out var grn))
                                    {
                                        grn.Grndetails.Add(detailDto);
                                    }
                                }
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
        public string State { get; set; } = null!;
    }

    public class GrnByDateFilterDto
    {
        public int? SupplierId { get; set; }
        public DateTime? date { get; set; }
        public DateTime? dateFrom { get; set; }
        public DateTime? dateTo { get; set; }
    }

    public class GrnPeriodFilterDto
    {
        public int? SupplierId { get; set; }
        public int? Year { get; set; }
        public int? Month { get; set; }
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
            public string? InvoiceReceiptImage { get; set; }
            public List<GRNDocumentDto> Documents { get; set; } = new List<GRNDocumentDto>();
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
            public string GrnNumber { get; set; } = string.Empty;

            public int ResponsiblePerson { get; set; }
            public string? DockerNo { get; set; }
            public string? Grnstatus { get; set; }

            [Required]
            public int SupplierId { get; set; }
            
            public string? InvoiceReceiptImage { get; set; }
            public List<GRNDocumentDto>? Documents { get; set; }
           
            public List<GRNDetailDto>? GrnDetails { get; set; }
        }


        public class GRNDetailDto
        {
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

            /// <summary>
            /// Bound as string so "" / null / invalid values do not cause HTTP 400.
            /// </summary>
            public string? ExpiryDate { get; set; }

            public string? Remarks1 { get; set; }

            public string? Remarks2 { get; set; }
            public string? Passedstatus { get; set; }
            public string? Rejectedstatus { get; set; }
            public bool ReturnToParty { get; set; }
            public int? Quantity { get; set; }

            public DateTime? UpdatedDate { get; set; }
        }

    public class GRNDocumentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/octet-stream";
        public string FileContent { get; set; } = string.Empty;
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

    public class StockRepairDefaultsRequestDto
    {
        public int SupplierId { get; set; }
        public int? ResponsiblePerson { get; set; }
        public string? DockerNumber { get; set; }
        public string? GrnStatus { get; set; }
    }

    public class StockRepairDefaultsResponseDto
    {
        public string? StockReceivedParty { get; set; } = null;
        public string? DocketNoDate { get; set; } = null;
        public string? Transport { get; set; } = null;
        public string? DebitNoteInvoice { get; set; } = null;
        public string? DateTime { get; set; } = null;
    }
}
}