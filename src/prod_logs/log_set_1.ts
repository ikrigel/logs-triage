// No action needed - healthy system; the agent should just analyze logs and end the process
export const LOGS = [
    { "time": "14:00:00", "service": "api-gateway", "level": "INFO", "msg": "Health check OK" },
    { "time": "14:00:05", "service": "order-service", "level": "DEBUG", "msg": "Queue depth sample" },
    { "time": "14:00:08", "service": "database-service", "level": "INFO", "msg": "Connection pool stats" },
    { "time": "14:01:00", "service": "api-gateway", "level": "INFO", "msg": "Health check OK" },
    { "time": "14:02:00", "service": "api-gateway", "level": "INFO", "msg": "Health check OK" },
    { "time": "14:02:01", "service": "payment-service", "level": "INFO", "msg": "Payment authorized" },
    { "time": "14:02:03", "service": "auth-service", "level": "INFO", "msg": "User login successful" },
    { "time": "14:02:04", "service": "database-service", "level": "INFO", "msg": "Executed query" },
    { "time": "14:02:13", "service": "api-gateway", "level": "INFO", "msg": "Request routed to payment-service" },
    { "time": "14:02:42", "service": "order-service", "level": "INFO", "msg": "Order created" },
    { "time": "14:02:42", "service": "api-gateway", "level": "INFO", "msg": "Latency p95" },
    { "time": "14:02:52", "service": "database-service", "level": "INFO", "msg": "Executed query" },
    { "time": "14:02:57", "service": "api-gateway", "level": "INFO", "msg": "Request routed to order-service" },
    { "time": "14:02:58", "service": "database-service", "level": "DEBUG", "msg": "Executed query" },
    { "time": "14:03:00", "service": "api-gateway", "level": "INFO", "msg": "Health check OK" },
    { "time": "14:03:30", "service": "database-service", "level": "INFO", "msg": "Executed query" },
    { "time": "14:03:36", "service": "api-gateway", "level": "INFO", "msg": "Request routed to order-service" },
    { "time": "14:04:00", "service": "api-gateway", "level": "INFO", "msg": "Health check OK" },
    { "time": "14:04:02", "service": "api-gateway", "level": "INFO", "msg": "Request routed to payment-service" },
    { "time": "14:04:14", "service": "order-service", "level": "INFO", "msg": "Order created" },
    { "time": "14:04:17", "service": "payment-service", "level": "INFO", "msg": "Payment authorized" },
    { "time": "14:04:18", "service": "api-gateway", "level": "DEBUG", "msg": "Cache hit" },
    { "time": "14:04:28", "service": "auth-service", "level": "DEBUG", "msg": "User login successful" },
    { "time": "14:04:38", "service": "database-service", "level": "DEBUG", "msg": "Executed query" },
    { "time": "14:04:58", "service": "database-service", "level": "INFO", "msg": "Executed query" },
    { "time": "14:05:00", "service": "api-gateway", "level": "INFO", "msg": "Health check OK" },
    { "time": "14:05:05", "service": "order-service", "level": "DEBUG", "msg": "Queue depth sample" },
    { "time": "14:05:08", "service": "database-service", "level": "INFO", "msg": "Connection pool stats" },
]

// No changes
export const RECENT_CHANGES = []