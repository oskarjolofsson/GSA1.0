"""
Read-only MCP: exposes the True Swing API's OpenAPI spec as one resource.

This is a pure *reference* server. It exposes exactly ONE read-only MCP
resource — the full OpenAPI schema, every route and every method, no
exceptions — and nothing else. No tools. No live API calls. No auth. Reading
the resource returns the spec; it never touches the backend or any user data,
so there is nothing to authenticate and nothing that can mutate.

Run standalone from the backend/ directory:

    python -m app.mcp.read_only_server        # serves http://127.0.0.1:9000/mcp

Host/port override via MCP_HOST / MCP_PORT.
"""
import os

from fastmcp import FastMCP

API_SCHEMA_URI = "resource://api-schema"


def build_spec_mcp(openapi_schema: dict) -> FastMCP:
    """Build a FastMCP server exposing the OpenAPI schema as a single resource."""
    mcp = FastMCP(name="True Swing API (spec)")

    @mcp.resource(
        API_SCHEMA_URI,
        name="api_schema",
        description=(
            "Full OpenAPI schema for the True Swing API — every route and "
            "method, no exceptions. Read-only reference only; this server "
            "exposes no callable tools and makes no live API calls."
        ),
        mime_type="application/json",
    )
    def api_schema() -> dict:
        return openapi_schema

    return mcp


def _main() -> None:
    from dotenv import load_dotenv

    load_dotenv()
    from app.core.app_factory import create_app

    # Generate the spec once at startup from the real app (the source of truth
    # for openapi.json), then serve it statically.
    openapi_schema = create_app().openapi()
    mcp = build_spec_mcp(openapi_schema)
    mcp.run(
        transport="http",
        host=os.getenv("MCP_HOST", "127.0.0.1"),
        port=int(os.getenv("MCP_PORT", "9000")),
    )


if __name__ == "__main__":
    _main()
