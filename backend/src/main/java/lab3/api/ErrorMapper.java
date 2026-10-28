package lab3.api;

import jakarta.json.JsonException;
import jakarta.json.bind.JsonbException;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import lab3.dto.ErrorResponse;
import lab3.service.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Provider
public class ErrorMapper implements ExceptionMapper<Throwable> {

    private static final Logger log = LoggerFactory.getLogger(ErrorMapper.class);

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof ApiException e) {
            log.info("Ошибка {}: {} {}", e.getStatus(), e.getMessage(), e.getDetails() == null ? "" : e.getDetails());
            return error(e.getStatus(), e.getMessage(), e.getDetails());
        }
        if (exception instanceof WebApplicationException e) {
            int status = e.getResponse().getStatus();
            log.info("Ошибка {}: {}", status, e.getMessage());
            return Response.fromResponse(e.getResponse())
                    .type(MediaType.APPLICATION_JSON_TYPE)
                    .entity(new ErrorResponse(status, messageFor(status), null))
                    .build();
        }
        if (exception instanceof ProcessingException
                || exception instanceof JsonException
                || exception instanceof JsonbException) {
            log.info("Некорректное тело запроса: {}", exception.getMessage());
            return error(400, "Некорректное тело запроса", null);
        }
        log.error("Необработанная ошибка", exception);
        return error(500, "Внутренняя ошибка сервера", null);
    }

    private static Response error(int status, String message, Map<String, String> details) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(new ErrorResponse(status, message, details))
                .build();
    }

    private static String messageFor(int status) {
        return switch (status) {
            case 400 -> "Некорректный запрос";
            case 404 -> "Ресурс не найден";
            case 405 -> "Метод не поддерживается";
            case 415 -> "Неподдерживаемый тип содержимого";
            default -> "Ошибка обработки запроса";
        };
    }
}
