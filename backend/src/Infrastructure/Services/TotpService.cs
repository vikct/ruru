using OtpNet;
using Ruru.Application.Common.Interfaces;

namespace Ruru.Infrastructure.Services;

public class TotpService : ITotpService
{
    public string GenerateSecret()
    {
        var key = KeyGeneration.GenerateRandomKey(20);
        return Base32Encoding.ToString(key);
    }

    public string GetQrCodeUri(string email, string secret)
    {
        return $"otpauth://totp/RuruPOS:{email}?secret={secret}&issuer=RuruPOS";
    }

    public bool VerifyCode(string secret, string code)
    {
        try
        {
            var key = Base32Encoding.ToBytes(secret);
            var totp = new Totp(key);
            return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
        }
        catch
        {
            return false;
        }
    }
}
