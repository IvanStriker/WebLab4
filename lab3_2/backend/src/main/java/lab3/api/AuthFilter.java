package lab3.api;

import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.annotation.Priority;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;
import lab3.model.User;
import lab3.repository.UserRepository;
import lab3.service.ApiException;
import lab3.service.JwtService;

import java.lang.reflect.Method;
import java.security.Principal;
import java.util.List;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {

    @Context
    private ResourceInfo resourceInfo;

    @Inject
    private JwtService jwtService;

    @Inject
    private UserRepository users;

    @Override
    public void filter(ContainerRequestContext request) {
        Method method = resourceInfo.getResourceMethod();
        if (method.isAnnotationPresent(PermitAll.class)) {
            return;
        }

        String header = request.getHeaderString("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ApiException(401, "Требуется авторизация");
        }
        DecodedJWT token = jwtService.verifyAccessToken(header.substring("Bearer ".length()));
        Long uid = token.getClaim("uid").asLong();
        if (uid == null) {
            throw new ApiException(401, "Токен недействителен или истёк");
        }
        User user = users.findById(uid)
                .filter(found -> found.getUsername().equals(token.getSubject()))
                .orElseThrow(() -> new ApiException(401, "Учетная запись изменена, войдите снова"));
        String username = user.getUsername();
        String role = user.getRole().name();

        RolesAllowed allowed = method.isAnnotationPresent(RolesAllowed.class)
                ? method.getAnnotation(RolesAllowed.class)
                : resourceInfo.getResourceClass().getAnnotation(RolesAllowed.class);
        if (allowed != null && !List.of(allowed.value()).contains(role)) {
            throw new ApiException(403, "Недостаточно прав для этой операции");
        }

        request.setSecurityContext(new SecurityContext() {
            @Override
            public Principal getUserPrincipal() {
                return () -> username;
            }

            @Override
            public boolean isUserInRole(String name) {
                return name.equals(role);
            }

            @Override
            public boolean isSecure() {
                return request.getUriInfo().getRequestUri().getScheme().equals("https");
            }

            @Override
            public String getAuthenticationScheme() {
                return "Bearer";
            }
        });
    }
}
