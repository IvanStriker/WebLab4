package lab3.api;

import jakarta.ws.rs.core.MultivaluedMap;
import lab3.dto.UserQuery;
import lab3.model.Role;
import lab3.service.ApiException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

public class UserQueryParser {

    private static final Set<String> FIELDS = Set.of("username", "email", "role");
    private static final Set<String> SORT_FIELDS = Set.of("id", "username", "email", "role");
    private static final Set<String> SINGLE_VALUE = Set.of("search", "sort", "page", "size");
    private static final int MAX_PAGE = 100_000;

    private UserQueryParser() {
    }

    public static UserQuery parse(MultivaluedMap<String, String> params) {
        Map<String, List<Object>> filters = new HashMap<>();
        Map<String, String> errors = new TreeMap<>();
        String search = null;
        String sort = "id";
        boolean descending = false;
        int page = 1;
        int size = 20;

        for (String name : params.keySet()) {
            List<String> values = params.get(name);
            String value = values.getFirst().strip();
            if (SINGLE_VALUE.contains(name) && values.size() > 1) {
                errors.put(name, "Параметр можно указать только один раз");
                continue;
            }
            if (values.stream().anyMatch(v -> v.indexOf('\0') >= 0)) {
                errors.put(name, "Недопустимый символ в значении");
                continue;
            }
            try {
                switch (name) {
                    case "search" -> search = value.isEmpty() ? null : value;
                    case "sort" -> {
                        descending = value.startsWith("-");
                        sort = descending ? value.substring(1) : value;
                        if (!SORT_FIELDS.contains(sort)) {
                            errors.put("sort", "Нельзя сортировать по полю \"" + sort + "\"");
                        }
                    }
                    case "page" -> page = Integer.parseInt(value);
                    case "size" -> size = Integer.parseInt(value);
                    default -> {
                        if (FIELDS.contains(name)) {
                            filters.put(name, convert(name, values));
                        } else {
                            errors.put(name, "Неизвестный параметр");
                        }
                    }
                }
            } catch (IllegalArgumentException e) {
                errors.put(name, "Некорректное значение");
            }
        }

        if (page < 1 || page > MAX_PAGE) {
            errors.put("page", "Номер страницы от 1 до " + MAX_PAGE);
        }
        if (size < 1 || size > 100) {
            errors.put("size", "Размер страницы от 1 до 100");
        }
        if (!errors.isEmpty()) {
            throw new ApiException(400, "Некорректные параметры запроса", errors);
        }
        return new UserQuery(filters, search, sort, descending, page, size);
    }

    private static List<Object> convert(String field, List<String> values) {
        List<Object> result = new ArrayList<>();
        for (String value : values) {
            if (field.equals("role")) {
                result.add(Role.valueOf(value.strip()));
            } else {
                result.add(value.strip());
            }
        }
        return result;
    }
}
