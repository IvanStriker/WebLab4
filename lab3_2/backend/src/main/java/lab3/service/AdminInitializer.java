package lab3.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.Startup;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class AdminInitializer {

    @Inject
    @ConfigProperty(name = "ADMIN_USERNAME")
    private String username;

    @Inject
    @ConfigProperty(name = "ADMIN_EMAIL")
    private String email;

    @Inject
    @ConfigProperty(name = "ADMIN_PASSWORD")
    private String password;

    @Inject
    private AuthService authService;

    void onStartup(@Observes Startup event) {
        authService.createAdminIfMissing(username, email, password);
    }
}
