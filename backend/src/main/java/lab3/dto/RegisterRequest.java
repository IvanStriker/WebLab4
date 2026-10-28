package lab3.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record RegisterRequest(
        @NotNull(message = "Обязательное поле")
        @Pattern(regexp = "^[A-Za-z0-9_]{3,32}$", message = "От 3 до 32 символов: латинские буквы, цифры и _")
        String username,

        @NotBlank(message = "Обязательное поле")
        @Email(regexp = EMAIL_FORMAT, message = "Некорректный адрес почты, пример: name@mail.ru")
        @Size(max = 255, message = "Не длиннее 255 символов")
        String email,

        @NotNull(message = "Обязательное поле")
        @Size(min = 8, message = "Не короче 8 символов")
        String password) {

    public static final String EMAIL_FORMAT = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$";

    public RegisterRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
