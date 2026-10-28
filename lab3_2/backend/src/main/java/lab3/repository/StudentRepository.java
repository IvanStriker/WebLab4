package lab3.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lab3.dto.StudentQuery;
import lab3.model.Student;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@ApplicationScoped
public class StudentRepository {

    @PersistenceContext
    private EntityManager em;

    public Optional<Student> findById(int id) {
        return Optional.ofNullable(em.find(Student.class, id));
    }

    public List<Student> find(StudentQuery query) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Student> criteria = cb.createQuery(Student.class);
        Root<Student> root = criteria.from(Student.class);

        Path<Object> sortField = field(root, query.sort());
        List<Order> order = new ArrayList<>();
        order.add(query.descending() ? cb.desc(sortField) : cb.asc(sortField));
        if (!query.sort().equals("id")) {
            order.add(cb.asc(root.get("id")));
        }
        criteria.where(conditions(cb, root, query)).orderBy(order);

        return em.createQuery(criteria)
                .setFirstResult(query.offset())
                .setMaxResults(query.size())
                .getResultList();
    }

    public long count(StudentQuery query) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> criteria = cb.createQuery(Long.class);
        Root<Student> root = criteria.from(Student.class);
        criteria.select(cb.count(root)).where(conditions(cb, root, query));
        return em.createQuery(criteria).getSingleResult();
    }

    public void save(Student student) {
        em.persist(student);
        em.flush();
    }

    public void delete(Student student) {
        em.remove(student);
    }

    private static Predicate[] conditions(CriteriaBuilder cb, Root<Student> root, StudentQuery query) {
        List<Predicate> conditions = new ArrayList<>();
        query.filters().forEach((name, values) -> conditions.add(field(root, name).in(values)));

        if (query.search() != null) {
            String pattern = "%" + escapeLike(query.search().toLowerCase(Locale.ROOT)) + "%";
            conditions.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern, '\\'),
                    cb.like(cb.lower(root.get("groupName")), pattern, '\\')));
        }
        return conditions.toArray(new Predicate[0]);
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static Path<Object> field(Root<Student> root, String name) {
        return root.get(name.equals("group") ? "groupName" : name);
    }
}
