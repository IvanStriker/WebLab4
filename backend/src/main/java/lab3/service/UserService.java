package lab3.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import lab3.dto.UserCreateRequest;
import lab3.dto.UserPage;
import lab3.dto.UserQuery;
import lab3.dto.UserResponse;
import lab3.dto.UserUpdateRequest;
import lab3.model.Role;
import lab3.model.User;
import lab3.repository.RefreshTokenRepository;
import lab3.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@ApplicationScoped
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Inject
    private UserRepository users;

    @Inject
    private RefreshTokenRepository refreshTokens;

    @Inject
    private RequestValidator validator;

    public UserPage find(UserQuery query) {
        List<UserResponse> items = users.find(query).stream().map(UserResponse::from).toList();
        return UserPage.of(items, query.page(), query.size(), users.count(query));
    }

    @Transactional
    public void delete(long id, String currentUsername) {
        User user = users.findById(id)
                .orElseThrow(() -> new ApiException(404, "Пользователь с id " + id + " не найден"));
        if (user.getRole() == Role.ADMIN && users.countByRole(Role.ADMIN) == 1) {
            throw new ApiException(422, "Нельзя удалить последнего администратора");
        }
        users.delete(user);
        log.info("Пользователь {} удалил учетную запись {} (id {})", currentUsername, user.getUsername(), id);
    }

    @Transactional
    public UserResponse create(UserCreateRequest request, String currentUsername) {
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

        String hash = BCrypt.hashpw(request.password(), BCrypt.gensalt(12));
        User user = new User(request.username(), request.email(), hash, request.role());
        try {
            users.save(user);
        } catch (PersistenceException e) {
            throw new ApiException(409, "Пользователь с таким именем или почтой уже существует");
        }
        log.info("Пользователь {} создал учетную запись {} с ролью {}", currentUsername, user.getUsername(), user.getRole());
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse update(long id, UserUpdateRequest request, String currentUsername) {
        validator.validate(request);
        User user = users.findById(id)
                .orElseThrow(() -> new ApiException(404, "Пользователь с id " + id + " не найден"));

        boolean usernameChanged = request.username() != null && !request.username().equals(user.getUsername());
        boolean emailChanged = request.email() != null && !request.email().equals(user.getEmail());
        boolean roleChanged = request.role() != null && request.role() != user.getRole();

        if (roleChanged && user.getUsername().equals(currentUsername)) {
            throw new ApiException(422, "Данные не прошли проверку",
                    Map.of("role", "Нельзя снять роль ADMIN с самого себя"));
        }
        if (request.password() != null) {
            validator.checkPasswordBytes(request.password());
        }

        Map<String, String> taken = new TreeMap<>();
        if (usernameChanged && users.findByUsername(request.username()).isPresent()) {
            taken.put("username", "Имя пользователя уже занято");
        }
        if (emailChanged && users.existsByEmail(request.email())) {
            taken.put("email", "Почта уже используется");
        }
        if (!taken.isEmpty()) {
            throw new ApiException(409, "Пользователь уже существует", taken);
        }

        if (usernameChanged) {
            user.setUsername(request.username());
        }
        if (emailChanged) {
            user.setEmail(request.email());
        }
        if (roleChanged) {
            user.setRole(request.role());
        }
        if (request.password() != null) {
            user.setPasswordHash(BCrypt.hashpw(request.password(), BCrypt.gensalt(12)));
        }
        try {
            users.flush();
        } catch (PersistenceException e) {
            throw new ApiException(409, "Пользователь с таким именем или почтой уже существует");
        }

        if (usernameChanged || roleChanged || request.password() != null) {
            refreshTokens.deleteByUser(user);
        }
        log.info("Пользователь {} изменил учетную запись {} (id {})", currentUsername, user.getUsername(), id);
        return UserResponse.from(user);
    }
}
