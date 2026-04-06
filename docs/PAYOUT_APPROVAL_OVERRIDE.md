# Welfare Payout Approval Override Protocol

## Purpose

This document provides comprehensive guidance for approving welfare payout requests that fail standard eligibility requirements. It establishes the dual-authorization approval process and outlines the required documentation and rationale for exceptional approvals.

---

## Eligibility Requirements (Standard)

Before a payout can be approved, the member must meet:

| Requirement | Minimum Standard |
|-------------|-------------------|
| Membership Status | Active |
| Membership Duration | 3 months |
| Total Contributions | KES 750 |
| Contributions (last 3 months) | 3 |
| Maximum Payout | Per event type limit |

---

## Dual Authorization Process

### Stage 1: Administrator Approval

**Role:** Administrator reviews the request and determines if exceptional approval is warranted.

#### Step-by-Step:

1. **Review Eligibility Report**
   - Navigate to `/dashboard/welfare` → Payout Requests
   - Identify the pending request with eligibility issues
   - Click "View Details" to see the full eligibility breakdown

2. **Document Eligibility Gaps**
   - Note which requirements failed (see reasons array in eligibility check)
   - Check if any warnings exist (pending payouts, recent rejections)

3. **Evaluate Justification for Override**
   - Review supporting documentation provided by member
   - Assess hardship circumstances
   - Check contribution history (even if below minimum, member may have contributed)

4. **Approve or Escalate**
   - If justification is sufficient: Click "Approve (Admin)" and provide reason
   - If unclear: Request additional documentation before proceeding

#### Required Documentation for Admin Approval:
- [ ] Payout request form (completed)
- [ ] Event verification document (death certificate, wedding certificate, medical report, etc.)
- [ ] Written explanation from member regarding eligibility shortfall
- [ ] Contribution history printout

---

### Stage 2: Treasurer Approval

**Role:** Treasurer verifies funds availability and authorizes final payment.

#### Step-by-Step:

1. **Review Admin Override Decision**
   - View the payout request after admin approval
   - Read the override justification provided by administrator

2. **Verify Fund Availability**
   - Check group welfare fund balance
   - Calculate remaining funds after payout
   - Ensure sufficient balance for payout

3. **Final Authorization**
   - Click "Approve (Treasurer)" to finalize
   - Mark for payment processing

#### Required Verification:
- [ ] Welfare fund has sufficient balance
- [ ] Payout amount is within event type limit
- [ ] All required documents are attached
- [ ] Admin approval is documented with justification

---

## Template: Override Justification

When approving an otherwise ineligible payout, document:

```markdown
## Override Justification

**Payout ID:** [ID]
**Member:** [Name] ([Member ID])
**Event Type:** [Type]
**Requested Amount:** KES [Amount]

### Eligibility Issues:
1. [Issue 1 - e.g., "Total contributions: KES 500 (minimum: KES 750)"]
2. [Issue 2 - e.g., "Membership: 2 months (minimum: 3 months)"]

### Justification for Override:
[Explain why this payout should be approved despite eligibility failure]

### Supporting Documents:
- [Document 1]
- [Document 2]

### Approved By:
- Administrator: [Name] - [Date]
- Treasurer: [Name] - [Date]
```

---

## Common Override Scenarios

### Scenario 1: Contributions Below Minimum
| Situation | Member has KES 500 total contributions |
|----------|----------------------------------------|
| Rationale | Member made significant contributions but due to recent join date, total is below threshold |
| Documentation | Bank statements showing contributions, explanation of contribution schedule |
| Action | Approve if contributions pattern shows commitment |

### Scenario 2: New Member Hardship
| Situation | Member joined < 3 months ago, facing emergency |
|----------|------------------------------------------------|
| Rationale | Immediate hardship (death, medical emergency) warrants consideration |
| Documentation | Death certificate/medical report, evidence of emergency |
| Action | Approve with reduced amount or deferred payment |

### Scenario 3: Documentation Gap
| Situation | All requirements met but documents incomplete |
|----------|------------------------------------------------|
| Rationale | Event occurred recently, documents pending issuance |
| Documentation | Partial documents, sworn statement, witness affidavit |
| Action | Approve with condition that documents submitted within 30 days |

---

## Policy References

### Constitution Article [X]: Welfare Fund
> The welfare fund exists to provide financial support to members facing genuine hardship. The committee shall consider each application on its merits, taking into account the member's contribution history and circumstances of the emergency.

### Clause 4.2: Exceptional Circumstances
> In cases of documented extreme hardship, the committee may approve payouts that do not fully meet eligibility requirements, provided dual authorization is obtained from the Administrator and Treasurer.

### Clause 4.2.1: Required Justification
> Any override of standard eligibility must be documented with:
> 1. Specific reasons for the exception
> 2. Supporting documentation
> 3. Written approval from both Administrator and Treasurer

---

## Quick Reference Checklist

### For Administrator:
- [ ] Review eligibility failure reasons
- [ ] Verify supporting documents exist
- [ ] Document override justification
- [ ] Click "Approve (Admin)"

### For Treasurer:
- [ ] Verify fund availability
- [ ] Review admin justification
- [ ] Ensure document completeness
- [ ] Click "Approve (Treasurer)"

---

## Audit Trail

All override approvals are automatically logged in the system:
- User ID of approver
- Timestamp
- Previous status
- New status
- Comments/justification provided

To view audit trail:
```bash
db.welfarepayouts.findOne({ _id: "<payout_id>" })
```

---

## Contact

For questions regarding override approvals:
- **Administrator:** [Name]
- **Treasurer:** [Name]
- **Welfare Officer:** [Name]
