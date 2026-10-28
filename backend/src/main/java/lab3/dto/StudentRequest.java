package lab3.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record StudentRequest(
        @NotNull(message = "Обязательное поле")
        @Positive(message = "Должно быть положительным числом")
        Integer id,

        @NotNull(message = "Обязательное поле")
        @Pattern(regexp = "^[А-Яа-яЁёA-Za-z-]+(\\s+[А-Яа-яЁёA-Za-z-]+)+$",
                message = "Минимум два слова из букв и дефисов, например \"Анна Смирнова\"")
        String name,

        @NotNull(message = "Обязательное поле")
        @Pattern(regexp = "^[A-Z]\\d{4}$", message = "Заглавная латинская буква и четыре цифры, например P3223")
        String group,

        @Positive(message = "Должно быть положительным числом")
        Integer dormitory,

        @Positive(message = "Должно быть положительным числом")
        Integer room,

        LocalDate moveinDate,

        @Pattern(regexp = "Россия|Беларусь|Китай", message = "Допустимые значения: Россия, Беларусь, Китай")
        String country,

        @Size(max = 500, message = "Не длиннее 500 символов")
        @Pattern(regexp = "[^\\x00]*", message = "Недопустимый символ")
        String notes) {

    public StudentRequest {
        name = strip(name);
        group = strip(group);
        notes = strip(notes);
    }

    private static String strip(String value) {
        return value == null ? null : value.strip();
    }
}
