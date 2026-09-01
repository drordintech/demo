using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace APIDRODIN.Converters
{
    /// <summary>
    /// Treats empty / invalid date strings as null instead of returning HTTP 400.
    /// </summary>
    public sealed class FlexibleNullableDateTimeConverter : JsonConverter<DateTime?>
    {
        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var value = reader.GetString();
                if (string.IsNullOrWhiteSpace(value) || value.StartsWith("0001-01-01", StringComparison.Ordinal))
                {
                    return null;
                }

                string[] formats = { "yyyy-MM-ddTHH:mm:ss.fffZ", "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-ddTHH:mm:ss.fffffffzzz", "yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy" };
                if (DateTime.TryParseExact(value, formats, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal | DateTimeStyles.AdjustToUniversal, out var parsedExact))
                {
                    return parsedExact;
                }

                if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
                {
                    return parsed;
                }

                return null;
            }

            if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt64(out var ticks))
            {
                try
                {
                    return DateTimeOffset.FromUnixTimeMilliseconds(ticks).LocalDateTime;
                }
                catch
                {
                    return null;
                }
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
            }
            else
            {
                writer.WriteStringValue(value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            }
        }
    }

    public sealed class FlexibleDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var value = reader.GetString();
                if (string.IsNullOrWhiteSpace(value) || value.StartsWith("0001-01-01", StringComparison.Ordinal))
                {
                    return DateTime.MinValue;
                }

                string[] formats = { "yyyy-MM-ddTHH:mm:ss.fffZ", "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-ddTHH:mm:ss.fffffffzzz", "yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy" };
                if (DateTime.TryParseExact(value, formats, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal | DateTimeStyles.AdjustToUniversal, out var parsedExact))
                {
                    return parsedExact;
                }

                if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
                {
                    return parsed;
                }

                return DateTime.MinValue;
            }

            if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt64(out var ticks))
            {
                try
                {
                    return DateTimeOffset.FromUnixTimeMilliseconds(ticks).LocalDateTime;
                }
                catch
                {
                    return DateTime.MinValue;
                }
            }

            return DateTime.MinValue;
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
        }
    }
}
