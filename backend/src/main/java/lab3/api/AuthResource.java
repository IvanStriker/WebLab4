package lab3.api;

import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import lab3.dto.LoginRequest;
import lab3.dto.RefreshRequest;
import lab3.dto.RegisterRequest;
import lab3.dto.TokenResponse;
import lab3.dto.UserResponse;
import lab3.service.AuthService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/auth")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Авторизация")
public class AuthResource {

    @Inject
    private AuthService authService;

    @Context
    private SecurityContext securityContext;

    @POST
    @Path("/register")
    @PermitAll
    @Operation(summary = "Регистрация пользователя с ролью USER")
    public Response register(RegisterRequest request) {
        return Response.status(201).entity(authService.register(request)).build();
    }

    @POST
    @Path("/login")
    @PermitAll
    @Operation(summary = "Вход: выдаёт access- и refresh-токены")
    public TokenResponse login(LoginRequest request) {
        return authService.login(request);
    }

    @POST
    @Path("/refresh")
    @PermitAll
    @Operation(summary = "Новая пара токенов по refresh-токену")
    public TokenResponse refresh(RefreshRequest request) {
        return authService.refresh(request);
    }

    @POST
    @Path("/logout")
    @PermitAll
    @Operation(summary = "Выход: отзывает refresh-токен")
    public void logout(RefreshRequest request) {
        authService.logout(request);
    }

    @GET
    @Path("/me")
    @SecurityRequirement(name = "bearer")
    @Operation(summary = "Текущий пользователь")
    public UserResponse me() {
        return authService.getUser(securityContext.getUserPrincipal().getName());
    }
}
