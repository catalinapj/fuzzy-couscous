import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

from app.models.base import Base
from app import models


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def get_url() -> str:
    """
    Resolve the database URL from DATABASE_URL environment variable.
    Convert Cloud SQL Proxy format for compatibility.
    """
    env_url = os.getenv("DATABASE_URL")
    
    if not env_url:
        raise ValueError(
            "DATABASE_URL environment variable is required for database migrations."
        )
    
    # Convert Cloud SQL Proxy format if needed
    # From: postgresql+psycopg2://user:pass@//cloudsql/project:region:instance/db
    # To:   postgresql+psycopg2://user:pass@localhost/db?host=/cloudsql/project:region:instance
    if "//cloudsql/" in env_url:
        import re
        match = re.match(
            r"(postgresql\+psycopg2://[^@]+)@//cloudsql/([^:]+:[^:]+:[^/]+)(/.+)",
            env_url
        )
        if match:
            converted_url = f"{match.group(1)}@localhost{match.group(3)}?host=/cloudsql/{match.group(2)}"
            return converted_url
    
    return env_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {}).copy()
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
