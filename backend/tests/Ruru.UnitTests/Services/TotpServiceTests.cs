using System;
using OtpNet;
using Ruru.Infrastructure.Services;
using Xunit;

namespace Ruru.UnitTests.Services;

public class TotpServiceTests
{
    private readonly TotpService _totpService;

    public TotpServiceTests()
    {
        _totpService = new TotpService();
    }

    [Fact]
    public void GenerateSecret_ShouldReturnValidBase32String()
    {
        // Act
        var secret = _totpService.GenerateSecret();

        // Assert
        Assert.NotNull(secret);
        Assert.NotEmpty(secret);
        
        // Base32 should be decodeable without throwing
        var bytes = Base32Encoding.ToBytes(secret);
        Assert.Equal(20, bytes.Length); // OtpNet KeyGeneration.GenerateRandomKey(20)
    }

    [Fact]
    public void GetQrCodeUri_ShouldContainCorrectParameters()
    {
        // Arrange
        var email = "test@rurupos.com";
        var secret = "NBSWY3DPEB3W64TBNQ";

        // Act
        var uri = _totpService.GetQrCodeUri(email, secret);

        // Assert
        Assert.Contains("otpauth://totp/RuruPOS:test@rurupos.com", uri);
        Assert.Contains("secret=NBSWY3DPEB3W64TBNQ", uri);
        Assert.Contains("issuer=RuruPOS", uri);
    }

    [Fact]
    public void VerifyCode_WithValidCurrentCode_ShouldReturnTrue()
    {
        // Arrange
        var secret = _totpService.GenerateSecret();
        var key = Base32Encoding.ToBytes(secret);
        var totp = new Totp(key);
        var validCode = totp.ComputeTotp();

        // Act
        var result = _totpService.VerifyCode(secret, validCode);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void VerifyCode_WithInvalidCode_ShouldReturnFalse()
    {
        // Arrange
        var secret = _totpService.GenerateSecret();
        var invalidCode = "123456";

        // Act
        var result = _totpService.VerifyCode(secret, invalidCode);

        // Assert
        Assert.False(result);
    }
}
