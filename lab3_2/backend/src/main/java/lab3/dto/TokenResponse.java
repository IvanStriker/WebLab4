package lab3.dto;

public record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn) {
}
