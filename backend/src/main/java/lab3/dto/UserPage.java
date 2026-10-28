package lab3.dto;

import java.util.List;

public record UserPage(List<UserResponse> items, int page, int size, long totalItems, long totalPages) {

    public static UserPage of(List<UserResponse> items, int page, int size, long totalItems) {
        long totalPages = (totalItems + size - 1) / size;
        return new UserPage(items, page, size, totalItems, totalPages);
    }
}
