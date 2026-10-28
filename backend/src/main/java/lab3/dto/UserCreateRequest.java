package lab3.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lab3.model.Role;

import java.util.Locale;

public record UserCreateRequest(
        @NotNull(message = "Обязательное поле")
        @Pattern(regexp = "^[A-Za-z0-9_]{3,32}$", message = "От 3 до 32 символов: латинские буквы, цифры и _")
        String username,

        @NotBlank(message = "Обязательное поле")
        @Email(regexp = RegisterRequest.EMAIL_FORMAT, message = "Некорректный адрес почты, пример: name@mail.ru")
        @Size(max = 255, message = "Не длиннее 255 символов")
        String email,

        @NotNull(message = "Обязательное поле")
        @Size(min = 8, message = "Не короче 8 символов")
        String password,

        @NotNull(message = "Обязательное поле")
        Role role) {

    public UserCreateRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
