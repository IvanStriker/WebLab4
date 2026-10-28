package lab3.service;

import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import lab3.dto.LoginRequest;
import lab3.dto.ProfileUpdateRequest;
import lab3.dto.RefreshRequest;
import lab3.dto.RegisterRequest;
import lab3.dto.TokenResponse;
import lab3.dto.UserResponse;
import lab3.dto.UserUpdateRequest;
import lab3.model.RefreshToken;
import lab3.model.Role;
import lab3.model.User;
import lab3.repository.RefreshTokenRepository;
import lab3.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

@ApplicationScoped
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String DUMMY_HASH = BCrypt.hashpw("dummy-password", BCrypt.gensalt(12));

    @Inject
    private UserRepository users;

    @Inject
    private RefreshTokenRepository refreshTokens;

    @Inject
    private JwtService jwtService;

    @Inject
    private RequestValidator validator;

    @Inject
    private UserService userService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        validator.validate(request);
        validator.checkPasswordBytes(request.password());
        Map<String, String> taken = new TreeMap<>();
        if (users.findByUsername(request.username()).isPresent()) {
            taken.put("username", "Имя пользователя уже занято");
        }
        if (users.existsByEmail(request.email())) {
            taken.put("email", "Почта уже используется");
        }
        if (!taken.isEmpty()) {
            throw new ApiException(409, "Пользователь уже существует", taken);
        }

        User user = createUser(request.username(), request.email(), request.password(), Role.USER);
        log.info("Зарегистрирован пользователь {}", user.getUsername());
        return UserResponse.from(user);
    }

    @Transactional
    public void createAdminIfMissing(String username, String email, String password) {
        RegisterRequest admin = new RegisterRequest(username, email, password);
        try {
            validator.validate(admin);
            validator.checkPasswordBytes(password);
        } catch (ApiException e) {
            throw new IllegalStateException("Некорректные ADMIN_USERNAME, ADMIN_EMAIL или ADMIN_PASSWORD: " + e.getDetails());
        }
        if (users.findByUsername(admin.username()).isPresent()) {
            return;
        }
        if (users.existsByEmail(admin.email())) {
            log.warn("Администратор {} не создан: почта {} уже занята", admin.username(), admin.email());
            return;
        }
        createUser(admin.username(), admin.email(), password, Role.ADMIN);
        log.info("Создан администратор {}", admin.username());
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        validator.validate(request);
        Optional<User> user = users.findByUsername(request.username());
        boolean passwordMatches = BCrypt.checkpw(request.password(),
                user.map(User::getPasswordHash).orElse(DUMMY_HASH));
        if (user.isEmpty() || !passwordMatches) {
            log.warn("Неудачная попытка входа: {}", request.username());
            throw new ApiException(401, "Неверное имя пользователя или пароль");
        }
        log.info("Пользователь {} вошёл в систему", request.username());
        return createTokens(user.get());
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        validator.validate(request);
        DecodedJWT token = jwtService.verifyRefreshToken(request.refreshToken());
        if (!refreshTokens.deleteByTokenId(token.getId())) {
            throw new ApiException(401, "Refresh-токен уже использован или отозван");
        }
        User user = users.findByUsername(token.getSubject())
                .orElseThrow(() -> new ApiException(401, "Пользователь не найден"));
        log.info("Пользователь {} обновил токены", user.getUsername());
        return createTokens(user);
    }

    @Transactional
    public void logout(RefreshRequest request) {
        validator.validate(request);
        DecodedJWT token = jwtService.verifyRefreshToken(request.refreshToken());
        refreshTokens.deleteByTokenId(token.getId());
        log.info("Пользователь {} вышел из системы", token.getSubject());
    }

    public UserResponse getUser(String username) {
        return users.findByUsername(username)
                .map(UserResponse::from)
                .orElseThrow(() -> new ApiException(404, "Пользователь не найден"));
    }

    @Transactional
    public TokenResponse updateProfile(String username, ProfileUpdateRequest request) {
        validator.validate(request);
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ApiException(404, "Пользователь не найден"));
        userService.update(user.getId(),
                new UserUpdateRequest(request.username(), request.email(), null, request.password()), username);
        return createTokens(user);
    }

    @Transactional
    public void deleteProfile(String username) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ApiException(404, "Пользователь не найден"));
        userService.delete(user.getId(), username);
    }

    private User createUser(String username, String email, String password, Role role) {
        String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));
        User user = new User(username, email, hash, role);
        try {
            users.save(user);
        } catch (PersistenceException e) {
            throw new ApiException(409, "Пользователь с таким именем или почтой уже существует");
        }
        return user;
    }

    private TokenResponse createTokens(User user) {
        refreshTokens.deleteExpired();
        String tokenId = UUID.randomUUID().toString();
        refreshTokens.save(new RefreshToken(tokenId, user, LocalDateTime.now().plus(jwtService.getRefreshTtl())));
        return new TokenResponse(
                jwtService.createAccessToken(user.getId(), user.getUsername(), user.getRole()),
                jwtService.createRefreshToken(user.getUsername(), tokenId),
                "Bearer",
                jwtService.getAccessTtl().toSeconds());
    }
}
