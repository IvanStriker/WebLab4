package lab3.dto;

import java.util.List;
import java.util.Map;

public record UserQuery(
        Map<String, List<Object>> filters,
        String search,
        String sort,
        boolean descending,
        int page,
        int size) {

    public int offset() {
        return (page - 1) * size;
    }
}
