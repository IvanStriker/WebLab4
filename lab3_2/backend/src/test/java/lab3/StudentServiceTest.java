package lab3;

import jakarta.json.Json;
import jakarta.json.bind.Jsonb;
import jakarta.json.bind.JsonbBuilder;
import lab3.dto.StudentRequest;
import lab3.dto.StudentResponse;
import lab3.model.Student;
import lab3.repository.StudentRepository;
import lab3.service.ApiException;
import lab3.service.RequestValidator;
import lab3.service.StudentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository repository;

    @Mock
    private RequestValidator validator;

    @Spy
    private Jsonb jsonb = JsonbBuilder.create();

    @InjectMocks
    private StudentService service;

    @Test
    void createSavesStudent() {
        StudentRequest request = request(412345, LocalDate.now().plusDays(10));
        when(repository.findById(412345)).thenReturn(Optional.empty());

        StudentResponse created = service.create(request, "admin");

        assertEquals("Анна Смирнова", created.name());
        verify(repository).save(any(Student.class));
    }

    @Test
    void createWithExistingIdIsConflict() {
        when(repository.findById(412345)).thenReturn(Optional.of(student()));

        ApiException error = assertThrows(ApiException.class, () -> service.create(request(412345, null), "admin"));

        assertEquals(409, error.getStatus());
    }

    @Test
    void moveinDateMustBeWithinSixMonths() {
        StudentRequest request = request(412345, LocalDate.now().plusYears(1));

        ApiException error = assertThrows(ApiException.class, () -> service.create(request, "admin"));

        assertEquals(422, error.getStatus());
    }

    @Test
    void getMissingStudentIsNotFound() {
        when(repository.findById(1)).thenReturn(Optional.empty());

        ApiException error = assertThrows(ApiException.class, () -> service.get(1));

        assertEquals(404, error.getStatus());
    }

    @Test
    void patchChangesOnlyGivenFieldsAndNullClears() {
        Student student = student();
        student.setDormitory(8);
        when(repository.findById(412345)).thenReturn(Optional.of(student));
        var changes = Json.createObjectBuilder().add("room", 12).addNull("dormitory").build();

        StudentResponse updated = service.patch(412345, changes, "admin");

        assertEquals(12, updated.room());
        assertNull(updated.dormitory());
        assertEquals("P3223", updated.group());
    }

    @Test
    void idCannotBeChanged() {
        when(repository.findById(412345)).thenReturn(Optional.of(student()));
        var changes = Json.createObjectBuilder().add("id", 1).build();

        ApiException error = assertThrows(ApiException.class, () -> service.patch(412345, changes, "admin"));

        assertEquals(422, error.getStatus());
    }

    private static StudentRequest request(int id, LocalDate moveinDate) {
        return new StudentRequest(id, "Анна Смирнова", "P3223", null, null, moveinDate, null, null);
    }

    private static Student student() {
        Student student = new Student(412345);
        student.setName("Анна Смирнова");
        student.setGroupName("P3223");
        return student;
    }
}
