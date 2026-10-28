package lab3.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(@NotBlank(message = "Обязательное поле") String refreshToken) {
}
