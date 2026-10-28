package lab3.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TreeMap;

@ApplicationScoped
public class RequestValidator {

    @Inject
    private Validator validator;

    public void validate(Object request) {
        if (request == null) {
            throw new ApiException(400, "Тело запроса не может быть пустым");
        }
        Map<String, String> errors = new TreeMap<>();
        for (ConstraintViolation<Object> violation : validator.validate(request)) {
            errors.put(violation.getPropertyPath().toString(), violation.getMessage());
        }
        if (!errors.isEmpty()) {
            throw new ApiException(422, "Данные не прошли проверку", errors);
        }
    }

    public void checkPasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(422, "Данные не прошли проверку",
                    Map.of("password", "Не длиннее 72 байт: 72 латинских или 36 русских букв"));
        }
    }
}
