package com.devtype.xp;

import com.devtype.common.entity.BaseEntity;
import com.devtype.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Immutable audit log record representing an individual XP award.
 * Enforces strict transactional idempotency via unique (user_id, source_type, source_id) constraint.
 */
@Entity
@Table(name = "xp_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_xp_transactions_source", columnNames = {"user_id", "source_type", "source_id"})
})
public class XpTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 50)
    private XpSourceType sourceType;

    @Column(name = "source_id", nullable = false, length = 100)
    private String sourceId;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public XpTransaction() {
        super();
    }

    public XpTransaction(User user, XpSourceType sourceType, String sourceId, Integer amount, String description) {
        this.user = user;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.amount = amount;
        this.description = description;
        this.createdAt = Instant.now();
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public XpSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(XpSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public String getSourceId() {
        return sourceId;
    }

    public void setSourceId(String sourceId) {
        this.sourceId = sourceId;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
