"""
Read-only spec MCP tests.

The MCP exposes exactly one thing: a single read-only resource returning the
full OpenAPI schema (every route + method, no exceptions). No tools, no
templates, no live calls. These lock that shape:

    1. nothing callable, nothing templated -> test_no_tools_no_templates
    2. exactly one resource, the spec       -> test_single_spec_resource
    3. the spec is complete (no exceptions)  -> test_spec_is_complete
"""
import json

import pytest
from dotenv import load_dotenv

# create_app reads DATABASE_URL / Supabase config transitively; mirror app.main.
load_dotenv()

from fastmcp import Client

from app.core.app_factory import create_app
from app.mcp.read_only_server import API_SCHEMA_URI, build_spec_mcp


@pytest.fixture
def anyio_backend():
    # Pin to asyncio (no trio installed); the anyio plugin drives the async tests.
    return "asyncio"


@pytest.fixture(scope="module")
def openapi_schema():
    return create_app().openapi()


@pytest.fixture(scope="module")
def mcp(openapi_schema):
    return build_spec_mcp(openapi_schema)


@pytest.mark.anyio
async def test_no_tools_no_templates(mcp):
    """Nothing callable, nothing parameterized — pure reference."""
    assert list(await mcp.list_tools()) == []
    assert list(await mcp.list_resource_templates()) == []


@pytest.mark.anyio
async def test_single_spec_resource(mcp):
    resources = await mcp.list_resources()
    assert len(resources) == 1
    assert str(resources[0].uri) == API_SCHEMA_URI


@pytest.mark.anyio
async def test_spec_is_complete(mcp, openapi_schema):
    """The resource returns the whole spec — every method, no exceptions."""
    async with Client(mcp) as client:
        result = await client.read_resource(API_SCHEMA_URI)
    data = json.loads(result[0].text)

    assert data == openapi_schema, "resource must return the full spec verbatim"

    methods = {
        method.lower()
        for path in data["paths"].values()
        for method in path
    }
    # No exceptions: mutating methods are present in the reference too.
    assert {"get", "post", "delete"} <= methods, f"missing methods: {methods}"
