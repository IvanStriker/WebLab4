package lab3.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lab3.model.RefreshToken;
import lab3.model.User;

import java.time.LocalDateTime;

@ApplicationScoped
public class RefreshTokenRepository {

    @PersistenceContext
    private EntityManager em;

    public void save(RefreshToken token) {
        em.persist(token);
    }

    public boolean deleteByTokenId(String tokenId) {
        return em.createQuery("DELETE FROM RefreshToken t WHERE t.tokenId = :tokenId")
                .setParameter("tokenId", tokenId)
                .executeUpdate() > 0;
    }

    public void deleteByUser(User user) {
        em.createQuery("DELETE FROM RefreshToken t WHERE t.user = :user")
                .setParameter("user", user)
                .executeUpdate();
    }

    public void deleteExpired() {
        em.createQuery("DELETE FROM RefreshToken t WHERE t.expiresAt < :now")
                .setParameter("now", LocalDateTime.now())
                .executeUpdate();
    }
}
