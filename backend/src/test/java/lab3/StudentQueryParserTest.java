package lab3;

import jakarta.json.Json;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import lab3.api.StudentQueryParser;
import lab3.dto.StudentQuery;
import lab3.service.ApiException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StudentQueryParserTest {

    @Test
    void defaultsWhenNoParams() {
        StudentQuery query = StudentQueryParser.parse(new MultivaluedHashMap<>());
        assertTrue(query.filters().isEmpty());
        assertEquals("id", query.sort());
        assertEquals(1, query.page());
        assertEquals(20, query.size());
    }

    @Test
    void repeatedParamGivesSeveralValues() {
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("group", "P3223");
        params.add("group", "P3224");
        params.add("dormitory", "8");
        params.add("sort", "-name");

        StudentQuery query = StudentQueryParser.parse(params);

        assertEquals(List.of("P3223", "P3224"), query.filters().get("group"));
        assertEquals(List.of(8), query.filters().get("dormitory"));
        assertEquals("name", query.sort());
        assertTrue(query.descending());
    }

    @Test
    void unknownAndInvalidParamsAreRejected() {
        MultivaluedMap<String, String> params = new MultivaluedHashMap<>();
        params.add("dormitry", "8");
        params.add("room", "abc");
        params.add("size", "500");

        ApiException error = assertThrows(ApiException.class, () -> StudentQueryParser.parse(params));

        assertEquals(400, error.getStatus());
        assertEquals(List.of("dormitry", "room", "size"), List.copyOf(error.getDetails().keySet()));
    }

    @Test
    void queryBodyIsParsedLikeGetParams() {
        var body = Json.createObjectBuilder()
                .add("group", Json.createArrayBuilder().add("P3223"))
                .add("page", 2)
                .build();

        StudentQuery query = StudentQueryParser.parse(body);

        assertEquals(List.of("P3223"), query.filters().get("group"));
        assertEquals(2, query.page());
    }
}
