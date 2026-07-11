namespace Ruru.Application.Common.Interfaces;

public interface ITotpService
{
    string GenerateSecret();
    string GetQrCodeUri(string email, string secret);
    bool VerifyCode(string secret, string code);
}
