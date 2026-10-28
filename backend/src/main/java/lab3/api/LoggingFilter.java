package lab3.api;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.ext.Provider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Principal;

@Provider
@PreMatching
public class LoggingFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final Logger log = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public void filter(ContainerRequestContext request) {
        request.setProperty("startTime", System.currentTimeMillis());
    }

    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        long time = System.currentTimeMillis() - (long) request.getProperty("startTime");
        Principal user = request.getSecurityContext().getUserPrincipal();
        log.info("{} {} -> {} ({} мс, пользователь: {})",
                request.getMethod(),
                request.getUriInfo().getRequestUri().getPath(),
                response.getStatus(),
                time,
                user == null ? "-" : user.getName());
    }
}
