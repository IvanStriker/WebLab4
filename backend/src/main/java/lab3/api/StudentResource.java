package lab3.api;

import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonObject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.UriInfo;
import lab3.dto.StudentPage;
import lab3.dto.StudentRequest;
import lab3.dto.StudentResponse;
import lab3.service.StudentService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.net.URI;

@Path("/requests")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "USER"})
@Tag(name = "Студенты")
@SecurityRequirement(name = "bearer")
public class StudentResource {

    @Inject
    private StudentService studentService;

    @Context
    private UriInfo uriInfo;

    @Context
    private SecurityContext securityContext;

    @GET
    @Operation(summary = "Список студентов",
            description = "Фильтры id, name, group, dormitory, room, moveinDate, country, notes "
                    + "(повтор параметра — ИЛИ, разные параметры — И), search, sort (-name — по убыванию), page, size")
    public StudentPage list() {
        return studentService.find(StudentQueryParser.parse(uriInfo.getQueryParameters()));
    }

    @QUERY
    @Operation(summary = "Список студентов, параметры в JSON-теле")
    public StudentPage query(JsonObject body) {
        return studentService.find(StudentQueryParser.parse(body));
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Студент по ИСУ")
    public StudentResponse get(@PathParam("id") int id) {
        return studentService.get(id);
    }

    @POST
    @RolesAllowed("ADMIN")
    @Operation(summary = "Добавить студента")
    public Response create(StudentRequest request) {
        StudentResponse created = studentService.create(request, currentUser());
        URI location = uriInfo.getAbsolutePathBuilder().path(String.valueOf(created.id())).build();
        return Response.created(location).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    @Operation(summary = "Заменить данные студента целиком")
    public StudentResponse replace(@PathParam("id") int id, StudentRequest request) {
        return studentService.replace(id, request, currentUser());
    }

    @PATCH
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    @Consumes({MediaType.APPLICATION_JSON, "application/merge-patch+json"})
    @Operation(summary = "Изменить часть полей (JSON Merge Patch)")
    public StudentResponse patch(@PathParam("id") int id, JsonObject changes) {
        return studentService.patch(id, changes, currentUser());
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("ADMIN")
    @Operation(summary = "Удалить студента")
    public void delete(@PathParam("id") int id) {
        studentService.delete(id, currentUser());
    }

    private String currentUser() {
        return securityContext.getUserPrincipal().getName();
    }
}
