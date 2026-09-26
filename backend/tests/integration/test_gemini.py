"""core.infrastructure.ai.gemini against a fake client: no network, no billing.

Lives outside tests/integration/AI/ on purpose. That directory is the live-AI suite and
is skipped without --run-ai; these must run on every push.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from core import config
from core.infrastructure.ai import gemini, get_model
from core.infrastructure.ai.errors import (
    AIEmptyResponse,
    AIError,
    AIInvalidResponse,
    AITimeout,
    AIVideoRejected,
)


def _fake_client(response_text=None, states=("ACTIVE",)):
    """A stand-in genai.Client. `states` is what successive files.get calls report."""
    fake = MagicMock()
    fake.models.generate_content.return_value = SimpleNamespace(text=response_text)
    fake.files.upload.return_value = SimpleNamespace(name="files/abc", uri="https://gemini/abc")
    fake.files.get.side_effect = [SimpleNamespace(state=s) for s in states]
    return fake


@pytest.fixture()
def use_fake():
    """Install a fake client for one test and return a setter for its behaviour."""
    with patch.object(gemini, "client") as client_fn:
        def install(**kwargs):
            fake = _fake_client(**kwargs)
            client_fn.return_value = fake
            return fake
        yield install


def _generate(**overrides):
    kwargs = dict(model="m", system_instruction="sys", contents=[{"role": "user"}], schema={"type": "object"})
    kwargs.update(overrides)
    return gemini.generate_json(**kwargs)


class TestGenerateJson:
    def test_returns_the_parsed_object(self, use_fake):
        use_fake(response_text=' {"law": "FACE"} ')

        assert _generate() == {"law": "FACE"}

    def test_sends_model_instruction_schema_and_contents(self, use_fake):
        fake = use_fake(response_text="{}")

        _generate(model="gemini-x", system_instruction="be a coach", schema={"type": "object", "x": 1})

        kwargs = fake.models.generate_content.call_args.kwargs
        assert kwargs["model"] == "gemini-x"
        assert kwargs["contents"] == [{"role": "user"}]
        assert kwargs["config"].system_instruction[0].text == "be a coach"
        assert kwargs["config"].response_json_schema == {"type": "object", "x": 1}
        assert kwargs["config"].temperature == 0.0

    @pytest.mark.parametrize("text", [None, "", "   "])
    def test_empty_response_raises(self, use_fake, text):
        use_fake(response_text=text)

        with pytest.raises(AIEmptyResponse):
            _generate()

    def test_invalid_json_raises(self, use_fake):
        use_fake(response_text="```json {not json")

        with pytest.raises(AIInvalidResponse):
            _generate()

    @pytest.mark.parametrize("text", ["[1, 2]", '"just a string"', "42"])
    def test_json_that_is_not_an_object_raises(self, use_fake, text):
        use_fake(response_text=text)

        with pytest.raises(AIInvalidResponse):
            _generate()

    def test_missing_model_raises_before_calling_gemini(self, use_fake):
        fake = use_fake(response_text="{}")

        with pytest.raises(AIError):
            _generate(model="")
        fake.models.generate_content.assert_not_called()

    def test_every_ai_error_is_an_ai_error(self):
        """Services catch AIError once rather than each subclass."""
        for cls in (AIEmptyResponse, AIInvalidResponse, AITimeout, AIVideoRejected):
            assert issubclass(cls, AIError)


class TestUploadedVideo:
    def test_yields_once_active_and_deletes_after(self, use_fake):
        fake = use_fake(states=("PROCESSING", "ACTIVE"))

        with patch.object(gemini.time, "sleep"), gemini.uploaded_video("swing.mp4") as file:
            assert file.name == "files/abc"
            fake.files.delete.assert_not_called()

        fake.files.upload.assert_called_once_with(file="swing.mp4")
        fake.files.delete.assert_called_once_with(name="files/abc")

    def test_failed_processing_raises_and_still_deletes(self, use_fake):
        fake = use_fake(states=("PROCESSING", "FAILED"))

        with patch.object(gemini.time, "sleep"), pytest.raises(AIVideoRejected):
            with gemini.uploaded_video("swing.mp4"):
                pass

        fake.files.delete.assert_called_once_with(name="files/abc")

    def test_times_out_and_still_deletes(self, use_fake):
        """The old poll had no limit; a stuck upload held its worker forever."""
        fake = use_fake(states=["PROCESSING"] * 3)

        with pytest.raises(AITimeout):
            with gemini.uploaded_video("swing.mp4", timeout_seconds=0):
                pass

        fake.files.delete.assert_called_once_with(name="files/abc")

    def test_deletes_when_the_block_raises(self, use_fake):
        fake = use_fake()

        with pytest.raises(RuntimeError):
            with gemini.uploaded_video("swing.mp4"):
                raise RuntimeError("analysis failed")

        fake.files.delete.assert_called_once_with(name="files/abc")

    def test_a_failed_delete_does_not_mask_the_result(self, use_fake):
        fake = use_fake()
        fake.files.delete.side_effect = RuntimeError("gemini down")

        with gemini.uploaded_video("swing.mp4") as file:
            pass

        assert file.name == "files/abc"

    def test_video_part_points_at_the_uploaded_file(self):
        assert gemini.video_part(SimpleNamespace(uri="https://gemini/abc")) == {
            "fileData": {"fileUri": "https://gemini/abc"}
        }


class TestClient:
    def test_missing_api_key_raises(self, monkeypatch):
        gemini.client.cache_clear()
        monkeypatch.setattr(config, "GEMINI_API_KEY", None)
        try:
            with pytest.raises(AIError, match="GEMINI_API_KEY"):
                gemini.client()
        finally:
            gemini.client.cache_clear()

    def test_client_is_created_once(self, monkeypatch):
        gemini.client.cache_clear()
        monkeypatch.setattr(config, "GEMINI_API_KEY", "test-key")
        try:
            with patch.object(gemini.genai, "Client") as client_cls:
                assert gemini.client() is gemini.client()
            client_cls.assert_called_once_with(api_key="test-key")
        finally:
            gemini.client.cache_clear()


def test_get_model_reads_config(monkeypatch):
    monkeypatch.setattr(config, "AI_MODEL", "gemini-test")

    assert get_model() == "gemini-test"


def test_default_model_is_flash():
    """Decided 2026-09-26: one model for every job."""
    import os
    if os.getenv("AI_MODEL"):
        pytest.skip("AI_MODEL is set in this environment")
    assert config.AI_MODEL == "gemini-3.8-flash"
