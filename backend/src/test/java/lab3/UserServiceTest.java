package lab3;

import lab3.dto.UserResponse;
import lab3.dto.UserUpdateRequest;
import lab3.model.Role;
import lab3.model.User;
import lab3.repository.RefreshTokenRepository;
import lab3.repository.UserRepository;
import lab3.service.ApiException;
import lab3.service.RequestValidator;
import lab3.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private RefreshTokenRepository refreshTokens;

    @Mock
    private RequestValidator validator;

    @InjectMocks
    private UserService service;

    @Test
    void updateChangesEmailWithoutRevokingTokens() {
        User user = user(2L, "anna", Role.USER);
        when(users.findById(2L)).thenReturn(Optional.of(user));

        UserResponse updated = service.update(2L, new UserUpdateRequest(null, "new@mail.ru", null, null), "admin");

        assertEquals("new@mail.ru", updated.email());
        verify(refreshTokens, never()).deleteByUser(user);
    }

    @Test
    void passwordChangeRevokesRefreshTokens() {
        User user = user(2L, "anna", Role.USER);
        when(users.findById(2L)).thenReturn(Optional.of(user));

        service.update(2L, new UserUpdateRequest(null, null, null, "password123"), "admin");

        verify(refreshTokens).deleteByUser(user);
    }

    @Test
    void adminCannotRemoveOwnAdminRole() {
        User admin = new User("admin", "admin@mail.ru", "hash", Role.ADMIN);
        when(users.findById(1L)).thenReturn(Optional.of(admin));

        ApiException error = assertThrows(ApiException.class,
                () -> service.update(1L, new UserUpdateRequest(null, null, Role.USER, null), "admin"));

        assertEquals(422, error.getStatus());
    }

    @Test
    void takenUsernameIsConflict() {
        User user = new User("anna", "anna@mail.ru", "hash", Role.USER);
        when(users.findById(2L)).thenReturn(Optional.of(user));
        when(users.findByUsername("admin")).thenReturn(Optional.of(new User("admin", "a@mail.ru", "h", Role.ADMIN)));

        ApiException error = assertThrows(ApiException.class,
                () -> service.update(2L, new UserUpdateRequest("admin", null, null, null), "admin"));

        assertEquals(409, error.getStatus());
    }

    @Test
    void missingUserIsNotFound() {
        when(users.findById(99L)).thenReturn(Optional.empty());

        ApiException error = assertThrows(ApiException.class,
                () -> service.update(99L, new UserUpdateRequest("bob", null, null, null), "admin"));

        assertEquals(404, error.getStatus());
    }

    private static User user(long id, String username, Role role) {
        User user = spy(new User(username, username + "@mail.ru", "hash", role));
        doReturn(id).when(user).getId();
        return user;
    }
}
