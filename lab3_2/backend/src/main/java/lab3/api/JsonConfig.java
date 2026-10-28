package lab3.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;
import jakarta.json.bind.JsonbConfig;
import jakarta.ws.rs.ext.ContextResolver;
import jakarta.ws.rs.ext.Provider;

@Provider
@ApplicationScoped
public class JsonConfig implements ContextResolver<Jsonb> {

    private final Jsonb jsonb = JsonbBuilder.create(new JsonbConfig()
            .withNullValues(true)
            .setProperty("jsonb.fail-on-unknown-properties", true));

    @Override
    public Jsonb getContext(Class<?> type) {
        return jsonb;
    }

    @Produces
    public Jsonb jsonb() {
        return jsonb;
    }
}
