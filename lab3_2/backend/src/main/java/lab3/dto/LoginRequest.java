package lab3.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
        @NotBlank(message = "Обязательное поле")
        @Pattern(regexp = "[^\\x00]*", message = "Недопустимый символ")
        String username,
        @NotBlank(message = "Обязательное поле") String password) {
}
