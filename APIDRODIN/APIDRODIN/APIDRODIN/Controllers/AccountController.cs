using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


namespace GRNAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly string _connectionString;
        private const string JWT_SECURITY_KEY = "yPkCqn4kSWLtaJwXvN2jGzpQRyTZ3gdXkt7FeBJP";
        private const int JWT_TOKEN_VALIDITY_MINS = 60;

        public AccountController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        [HttpPost("Authenticate")]
        public ActionResult<AuthenticationResponse?> Authenticate([FromBody] AuthenticationRequest authenticationRequest)
        {
            try
            {
                var response = AuthenticateUser(authenticationRequest);
                if (response == null)
                {
                    return BadRequest(new { message = "Username or password is incorrect" });
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal Server Error", error = ex.Message });
            }
        }

        private AuthenticationResponse? AuthenticateUser(AuthenticationRequest authenticationRequest)
        {
            if (authenticationRequest == null || string.IsNullOrWhiteSpace(authenticationRequest.UserName) ||
                string.IsNullOrWhiteSpace(authenticationRequest.Password))
            {
                return null;
            }

            string query = @"
                SELECT c.CompanyId, c.CompanyShortName, c.CompanyFullName, 
                       l.LoginId, l.EmailAddress, l.LoginType, l.Password, l.IsActive
                FROM Companies c
                INNER JOIN Login l ON c.CompanyId = l.CompanyId
                WHERE l.EmailAddress = @UserName AND l.Password = @Password";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@UserName", authenticationRequest.UserName);
                    command.Parameters.AddWithValue("@Password", authenticationRequest.Password);

                    connection.Open();
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            bool isActive = Convert.ToBoolean(reader["IsActive"]);
                            if (!isActive)
                            {
                                return null;
                            }

                            return GenerateJwtToken(
                                authenticationRequest,
                                reader["CompanyFullName"].ToString(),
                                reader["LoginType"].ToString(),
                                Convert.ToInt32(reader["CompanyId"])
                            );
                        }
                    }
                }
            }
            return null;
        }

        
        private AuthenticationResponse? GenerateJwtToken(AuthenticationRequest authenticationRequest, string companyFullName, string loginType, int companyId)
        {
            if (string.IsNullOrWhiteSpace(authenticationRequest.UserName) || string.IsNullOrWhiteSpace(authenticationRequest.Password))
                return null;

            var tokenExpiryTimeStamp = DateTime.Now.AddMinutes(JWT_TOKEN_VALIDITY_MINS);
            var tokenKey = Encoding.ASCII.GetBytes(JWT_SECURITY_KEY);
            var claimsIdentity = new ClaimsIdentity(new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Name, authenticationRequest.UserName)
            });

            var signingCredentials = new SigningCredentials(
                new SymmetricSecurityKey(tokenKey),
                SecurityAlgorithms.HmacSha256Signature);

            var securityTokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = claimsIdentity,
                Expires = tokenExpiryTimeStamp,
                SigningCredentials = signingCredentials
            };

            var jwtSecurityTokenHandler = new JwtSecurityTokenHandler();
            var securityToken = jwtSecurityTokenHandler.CreateToken(securityTokenDescriptor);
            var token = jwtSecurityTokenHandler.WriteToken(securityToken);

            return new AuthenticationResponse
            {
                UserName = authenticationRequest.UserName,
                ExpiresIn = (int)tokenExpiryTimeStamp.Subtract(DateTime.Now).TotalSeconds,
                JwtToken = token,
                CompanyName = companyFullName,
                CompanyId = companyId,
                LoginType = loginType
            };
        }

        public class AuthenticationRequest
        {
            public string UserName { get; set; }
            public string Password { get; set; }
        }

        public class AuthenticationResponse
        {
            public string UserName { get; set; }
            public string JwtToken { get; set; }
            public int ExpiresIn { get; set; }
            public string CompanyName { get; set; }
            public string LoginType { get; set; }
            public int CompanyId { get; set; }
        }
    }
}
