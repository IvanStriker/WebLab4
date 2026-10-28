package lab3.api;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.UriInfo;
import lab3.dto.UserCreateRequest;
import lab3.dto.UserPage;
import lab3.dto.UserResponse;
import lab3.dto.UserUpdateRequest;
import lab3.service.UserService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

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

    @Context
    private UriInfo uriInfo;

    @GET
    @Operation(summary = "Список учетных записей",
            description = "Фильтры username, email, role (повтор параметра: ИЛИ, разные параметры: И), "
                    + "search (подстрока в имени или почте), sort (-username: по убыванию), page, size")
    public UserPage list() {
        return userService.find(UserQueryParser.parse(uriInfo.getQueryParameters()));
    }

    @POST
    @Operation(summary = "Создать учетную запись с любой ролью")
    public Response create(UserCreateRequest request) {
        UserResponse created = userService.create(request, securityContext.getUserPrincipal().getName());
        return Response.status(201).entity(created).build();
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Удалить учетную запись (последнего администратора удалить нельзя)")
    public void delete(@PathParam("id") long id) {
        userService.delete(id, securityContext.getUserPrincipal().getName());
    }

    @PATCH
    @Path("/{id}")
    @Operation(summary = "Изменить имя, почту, роль или пароль учетной записи")
    public UserResponse update(@PathParam("id") long id, UserUpdateRequest request) {
        return userService.update(id, request, securityContext.getUserPrincipal().getName());
    }
}
