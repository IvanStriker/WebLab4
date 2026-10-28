package lab3.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lab3.dto.UserQuery;
import lab3.model.Role;
import lab3.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@ApplicationScoped
public class UserRepository {

    @PersistenceContext
    private EntityManager em;

    public List<User> find(UserQuery query) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<User> criteria = cb.createQuery(User.class);
        Root<User> root = criteria.from(User.class);

        List<Order> order = new ArrayList<>();
        order.add(query.descending() ? cb.desc(root.get(query.sort())) : cb.asc(root.get(query.sort())));
        if (!query.sort().equals("id")) {
            order.add(cb.asc(root.get("id")));
        }
        criteria.where(conditions(cb, root, query)).orderBy(order);

        return em.createQuery(criteria)
                .setFirstResult(query.offset())
                .setMaxResults(query.size())
                .getResultList();
    }

    public long count(UserQuery query) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> criteria = cb.createQuery(Long.class);
        Root<User> root = criteria.from(User.class);
        criteria.select(cb.count(root)).where(conditions(cb, root, query));
        return em.createQuery(criteria).getSingleResult();
    }

    public Optional<User> findById(long id) {
        return Optional.ofNullable(em.find(User.class, id));
    }

    public Optional<User> findByUsername(String username) {
        return em.createQuery("SELECT u FROM User u WHERE u.username = :username", User.class)
                .setParameter("username", username)
                .getResultStream()
                .findFirst();
    }

    public long countByRole(Role role) {
        return em.createQuery("SELECT COUNT(u) FROM User u WHERE u.role = :role", Long.class)
                .setParameter("role", role)
                .getSingleResult();
    }

    public boolean existsByEmail(String email) {
        return em.createQuery("SELECT COUNT(u) FROM User u WHERE u.email = :email", Long.class)
                .setParameter("email", email)
                .getSingleResult() > 0;
    }

    public void save(User user) {
        em.persist(user);
        em.flush();
    }

    public void flush() {
        em.flush();
    }

    public void delete(User user) {
        em.remove(user);
    }

    private static Predicate[] conditions(CriteriaBuilder cb, Root<User> root, UserQuery query) {
        List<Predicate> conditions = new ArrayList<>();
        query.filters().forEach((name, values) -> conditions.add(root.get(name).in(values)));

        if (query.search() != null) {
            String pattern = "%" + escapeLike(query.search().toLowerCase(Locale.ROOT)) + "%";
            conditions.add(cb.or(
                    cb.like(cb.lower(root.get("username")), pattern, '\\'),
                    cb.like(cb.lower(root.get("email")), pattern, '\\')));
        }
        return conditions.toArray(new Predicate[0]);
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
