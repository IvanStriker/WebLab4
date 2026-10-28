package lab3.service;

import java.util.Map;

public class ApiException extends RuntimeException {

    private final int status;
    private final Map<String, String> details;

    public ApiException(int status, String message) {
        this(status, message, null);
    }

    public ApiException(int status, String message, Map<String, String> details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public int getStatus() {
        return status;
    }

    public Map<String, String> getDetails() {
        return details;
    }
}
