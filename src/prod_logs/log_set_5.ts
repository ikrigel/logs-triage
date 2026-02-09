// Deep Dive Investigation Needed; agent should run searchLogsByIdentifier with batch_id, user_id, then source, and ultimately find that the root issue is that the zendesk token expired
export const LOGS = [
    { "time": "12:00:00", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "salesforce" },
    { "time": "12:04:08", "service": "enrichment-service", "level": "INFO", "msg": "Queue polled" },
    { "time": "12:08:16", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "zendesk" },
    { "time": "12:12:24", "service": "source-connector", "level": "ERROR", "msg": "Zendesk token expired", "source_id": "zendesk" },
    { "time": "12:16:33", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "monday" },
    { "time": "12:20:41", "service": "enrichment-service", "level": "ERROR", "msg": "Batch enrichment failed to enrich user data. Check source log for issue.", "user_id": "user_42891", "source_id": "zendesk" },
    { "time": "12:24:49", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "salesforce" },
    { "time": "12:28:57", "service": "enrichment-service", "level": "ERROR", "msg": "Batch enrichment failed to enrich user data. Check source log for issue.", "user_id": "user_73521", "source_id": "zendesk" },
    { "time": "12:33:06", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "zendesk" },
    { "time": "12:37:14", "service": "source-connector", "level": "ERROR", "msg": "Zendesk token expired", "source_id": "zendesk" },
    { "time": "12:41:22", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "monday" },
    { "time": "12:45:31", "service": "enrichment-service", "level": "INFO", "msg": "Request processed" },
    { "time": "12:49:39", "service": "enrichment-service", "level": "ERROR", "msg": "Batch enrichment failed to enrich user data. Check source log for issue.", "user_id": "user_91033", "source_id": "zendesk" },
    { "time": "12:53:47", "service": "enrichment-service", "level": "INFO", "msg": "Latency within SLA" },
    { "time": "12:57:55", "service": "enrichment-service", "level": "ERROR", "msg": "Batch enrichment failed to enrich user data. Check source log for issue.", "user_id": "user_67234", "source_id": "zendesk" },
    { "time": "13:02:04", "service": "enrichment-service", "level": "INFO", "msg": "Metrics flushed" },
    { "time": "13:06:12", "service": "source-connector", "level": "ERROR", "msg": "Zendesk token expired", "source_id": "zendesk" },
    { "time": "13:10:20", "service": "enrichment-service", "level": "INFO", "msg": "Queue polled" },
    { "time": "13:14:28", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "salesforce" },
    { "time": "13:18:37", "service": "enrichment-service", "level": "ERROR", "msg": "Batch enrichment failed to enrich user data", "user_id": "user_81920", "source_id": "zendesk" },
    { "time": "13:22:45", "service": "source-connector", "level": "INFO", "msg": "Connector heartbeat OK", "source_id": "zendesk" },
    { "time": "13:26:53", "service": "enrichment-service", "level": "INFO", "msg": "User enrichment completed with errors for user.", "user_id": "user_42891", "batch_id": "batch_20250117_A" },
    { "time": "13:31:02", "service": "enrichment-service", "level": "INFO", "msg": "User enrichment completed with errors for user.", "user_id": "user_73521", "batch_id": "batch_20250117_A" },
    { "time": "13:35:10", "service": "enrichment-service", "level": "INFO", "msg": "User enrichment completed with errors for user.", "user_id": "user_91033", "batch_id": "batch_20250117_A" },
    { "time": "13:39:18", "service": "enrichment-service", "level": "INFO", "msg": "User enrichment completed with errors for user.", "user_id": "user_67234", "batch_id": "batch_20250117_A" },
    { "time": "13:43:26", "service": "enrichment-service", "level": "ERROR", "msg": "Failed to enrich user data", "batch_id": "batch_20250117_A" },
    { "time": "13:47:35", "service": "enrichment-service", "level": "ERROR", "msg": "Failed to enrich user data", "batch_id": "batch_20250117_A" },
    { "time": "13:51:43", "service": "enrichment-service", "level": "ERROR", "msg": "Failed to enrich user data", "batch_id": "batch_20250117_A" },
    { "time": "13:55:51", "service": "enrichment-service", "level": "ERROR", "msg": "Failed to enrich user data", "batch_id": "batch_20250117_A" },
    { "time": "13:59:59", "service": "enrichment-service", "level": "ERROR", "msg": "Failed to enrich user data", "batch_id": "batch_20250117_A" }
]

// No relevant changes
export const RECENT_CHANGES = []