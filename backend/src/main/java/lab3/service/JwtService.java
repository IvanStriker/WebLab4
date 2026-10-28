package lab3.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.Startup;
import jakarta.inject.Inject;
import lab3.model.Role;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.time.Instant;

@ApplicationScoped
public class JwtService {

    @Inject
    @ConfigProperty(name = "JWT_SECRET")
    private String secret;

    @Inject
    @ConfigProperty(name = "JWT_ACCESS_TTL_MINUTES", defaultValue = "15")
    private long accessTtlMinutes;

    @Inject
    @ConfigProperty(name = "JWT_REFRESH_TTL_DAYS", defaultValue = "7")
    private long refreshTtlDays;

    private Algorithm algorithm;
    private JWTVerifier accessVerifier;
    private JWTVerifier refreshVerifier;

    void init(@Observes Startup event) {
        if (secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET должен быть не короче 32 символов");
        }
        algorithm = Algorithm.HMAC256(secret);
        accessVerifier = JWT.require(algorithm).withClaim("type", "access").withClaimPresence("uid").build();
        refreshVerifier = JWT.require(algorithm).withClaim("type", "refresh").build();
    }

    public String createAccessToken(long userId, String username, Role role) {
        Instant now = Instant.now();
        return JWT.create()
                .withSubject(username)
                .withClaim("uid", userId)
                .withClaim("role", role.name())
                .withClaim("type", "access")
                .withIssuedAt(now)
                .withExpiresAt(now.plus(getAccessTtl()))
                .sign(algorithm);
    }

    public String createRefreshToken(String username, String tokenId) {
        Instant now = Instant.now();
        return JWT.create()
                .withSubject(username)
                .withJWTId(tokenId)
                .withClaim("type", "refresh")
                .withIssuedAt(now)
                .withExpiresAt(now.plus(getRefreshTtl()))
                .sign(algorithm);
    }

    public DecodedJWT verifyAccessToken(String token) {
        return verify(accessVerifier, token);
    }

    public DecodedJWT verifyRefreshToken(String token) {
        return verify(refreshVerifier, token);
    }

    public Duration getAccessTtl() {
        return Duration.ofMinutes(accessTtlMinutes);
    }

    public Duration getRefreshTtl() {
        return Duration.ofDays(refreshTtlDays);
    }

    private static DecodedJWT verify(JWTVerifier verifier, String token) {
        try {
            return verifier.verify(token);
        } catch (JWTVerificationException e) {
            throw new ApiException(401, "Токен недействителен или истёк");
        }
    }
}
