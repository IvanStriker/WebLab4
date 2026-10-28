package lab3.dto;

import lab3.model.Student;

import java.time.LocalDate;

public record StudentResponse(
        int id,
        String name,
        String group,
        Integer dormitory,
        Integer room,
        LocalDate moveinDate,
        String country,
        String notes) {

    public static StudentResponse from(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getName(),
                student.getGroupName(),
                student.getDormitory(),
                student.getRoom(),
                student.getMoveinDate(),
                student.getCountry(),
                student.getNotes());
    }
}
