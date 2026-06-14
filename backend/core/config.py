from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-change-in-prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://waremind:waremind_secret@localhost:5432/waremind"

    # ClickHouse
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = ""
    CLICKHOUSE_DB: str = "waremind"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_WMS_EVENTS_TOPIC: str = "wms-events"
    KAFKA_ALERTS_TOPIC: str = "warehouse-alerts"

    # External APIs
    OPENWEATHER_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""


settings = Settings()
