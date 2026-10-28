package lab3.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.bind.Jsonb;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import lab3.dto.StudentPage;
import lab3.dto.StudentQuery;
import lab3.dto.StudentRequest;
import lab3.dto.StudentResponse;
import lab3.model.Student;
import lab3.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@ApplicationScoped
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);

    @Inject
    private StudentRepository repository;

    @Inject
    private RequestValidator validator;

    @Inject
    private Jsonb jsonb;

    public StudentPage find(StudentQuery query) {
        List<StudentResponse> items = repository.find(query).stream()
                .map(StudentResponse::from)
                .toList();
        return StudentPage.of(items, query.page(), query.size(), repository.count(query));
    }

    public StudentResponse get(int id) {
        return StudentResponse.from(findExisting(id));
    }

    @Transactional
    public StudentResponse create(StudentRequest request, String username) {
        validator.validate(request);
        checkMoveinDate(request.moveinDate());
        if (repository.findById(request.id()).isPresent()) {
            throw new ApiException(409, "Студент с ИСУ " + request.id() + " уже существует");
        }

        Student student = new Student(request.id());
        copy(request, student);
        try {
            repository.save(student);
        } catch (PersistenceException e) {
            throw new ApiException(409, "Студент с ИСУ " + request.id() + " уже существует");
        }
        log.info("Пользователь {} добавил студента {}", username, student.getId());
        return StudentResponse.from(student);
    }

    @Transactional
    public StudentResponse replace(int id, StudentRequest request, String username) {
        return update(findExisting(id), request, username);
    }

    @Transactional
    public StudentResponse patch(int id, JsonObject changes, String username) {
        Student student = findExisting(id);
        JsonObject current = jsonb.fromJson(jsonb.toJson(StudentResponse.from(student)), JsonObject.class);
        String merged = Json.createMergePatch(changes).apply(current).toString();
        return update(student, jsonb.fromJson(merged, StudentRequest.class), username);
    }

    @Transactional
    public void delete(int id, String username) {
        repository.delete(findExisting(id));
        log.info("Пользователь {} удалил студента {}", username, id);
    }

    private StudentResponse update(Student student, StudentRequest request, String username) {
        validator.validate(request);
        if (!student.getId().equals(request.id())) {
            throw new ApiException(422, "Данные не прошли проверку", Map.of("id", "ИСУ студента изменить нельзя"));
        }
        if (!Objects.equals(request.moveinDate(), student.getMoveinDate())) {
            checkMoveinDate(request.moveinDate());
        }
        copy(request, student);
        log.info("Пользователь {} изменил студента {}", username, student.getId());
        return StudentResponse.from(student);
    }

    private Student findExisting(int id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(404, "Студент с ИСУ " + id + " не найден"));
    }

    private static void checkMoveinDate(LocalDate date) {
        LocalDate today = LocalDate.now();
        if (date != null && (date.isBefore(today) || date.isAfter(today.plusMonths(6)))) {
            throw new ApiException(422, "Данные не прошли проверку", Map.of("moveinDate",
                    "Дата заселения — не раньше сегодняшней и не позже чем через 6 месяцев"));
        }
    }

    private static void copy(StudentRequest request, Student student) {
        student.setName(request.name());
        student.setGroupName(request.group());
        student.setDormitory(request.dormitory());
        student.setRoom(request.room());
        student.setMoveinDate(request.moveinDate());
        student.setCountry(request.country());
        student.setNotes(request.notes());
    }
}
