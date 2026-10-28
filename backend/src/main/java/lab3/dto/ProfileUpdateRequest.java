package lab3.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record ProfileUpdateRequest(
        @Pattern(regexp = "^[A-Za-z0-9_]{3,32}$", message = "От 3 до 32 символов: латинские буквы, цифры и _")
        String username,

        @Email(regexp = RegisterRequest.EMAIL_FORMAT, message = "Некорректный адрес почты, пример: name@mail.ru")
        @Size(min = 3, max = 255, message = "От 3 до 255 символов")
        String email,

        @Size(min = 8, message = "Не короче 8 символов")
        String password) {

    public ProfileUpdateRequest {
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
