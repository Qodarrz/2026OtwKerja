-- Insert default SLA rules for each workflow stage
-- Based on typical government office processing times

-- Document Check: 2 days (48 hours)
INSERT INTO "SLARule" (id, stage, "maxDurationHours", "warningThreshold", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'DOCUMENT_CHECK',
    48,
    0.8,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Field Inspection: 3 days (72 hours)
INSERT INTO "SLARule" (id, stage, "maxDurationHours", "warningThreshold", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'FIELD_INSPECTION',
    72,
    0.8,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Legalization: 2 days (48 hours)
INSERT INTO "SLARule" (id, stage, "maxDurationHours", "warningThreshold", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'LEGALIZATION',
    48,
    0.8,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
