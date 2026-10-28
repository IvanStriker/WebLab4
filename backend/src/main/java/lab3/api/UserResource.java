package lab3.api;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import lab3.dto.UserResponse;
import lab3.dto.UserUpdateRequest;
import lab3.service.UserService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/users")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("ADMIN")
@Tag(name = "Пользователи")
@SecurityRequirement(name = "bearer")
public class UserResource {

    @Inject
    private UserService userService;

    @Context
    private SecurityContext securityContext;

    @GET
    @Operation(summary = "Список учетных записей")
    public List<UserResponse> list() {
        return userService.findAll();
    }

    @PATCH
    @Path("/{id}")
    @Operation(summary = "Изменить имя, почту, роль или пароль учетной записи")
    public UserResponse update(@PathParam("id") long id, UserUpdateRequest request) {
        return userService.update(id, request, securityContext.getUserPrincipal().getName());
    }
}
