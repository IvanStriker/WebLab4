package lab3.dto;

import jakarta.json.bind.annotation.JsonbNillable;
import jakarta.json.bind.annotation.JsonbPropertyOrder;

import java.util.Map;

@JsonbPropertyOrder({"status", "error", "details"})
public record ErrorResponse(int status, String error, @JsonbNillable(false) Map<String, String> details) {
}
