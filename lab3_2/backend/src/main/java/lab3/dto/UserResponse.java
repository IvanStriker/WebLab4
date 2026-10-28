package lab3.dto;

import lab3.model.Role;
import lab3.model.User;

public record UserResponse(long id, String username, String email, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
    }
}
