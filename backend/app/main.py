from dotenv import load_dotenv

# Load environment variables before creating the app
load_dotenv()

from app.core.app_factory import create_app

# Create the FastAPI app with all configurations
app = create_app()