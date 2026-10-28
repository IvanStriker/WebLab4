package lab3.dto;

import java.util.List;

public record StudentPage(List<StudentResponse> items, int page, int size, long totalItems, long totalPages) {

    public static StudentPage of(List<StudentResponse> items, int page, int size, long totalItems) {
        long totalPages = (totalItems + size - 1) / size;
        return new StudentPage(items, page, size, totalItems, totalPages);
    }
}
