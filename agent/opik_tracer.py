"""
Recipe Agent Demo with Google ADK and Opik Integration
=======================================================

A multi-agent system for recipe suggestions and research using Google's Agent Development Kit
with Comet Opik observability integration.

Agents:
- RecipeSuggesterAgent: Suggests recipes based on provided ingredients
- RecipeResearchAgent: Researches additional context and information about recipes
"""

import os
import asyncio
import warnings
from dotenv import load_dotenv
from google.adk.agents import Agent, SequentialAgent
from google.adk.runners import InMemoryRunner
from google.genai import types
from opik.integrations.adk import OpikTracer
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.live import Live
from rich.spinner import Spinner

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# Initialize Rich console
console = Console()

# Load environment variables
load_dotenv()

# Import API key manager for fallback support
from agent.api_key_manager import get_google_api_key

# Verify API key is available
google_key = get_google_api_key()
if not google_key:
    raise ValueError("No Google API keys found. Please set GOOGLE_API_KEY or GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc. in .env file.")

# Set the key in environment for Google ADK to use
os.environ["GOOGLE_API_KEY"] = google_key

# Remove GEMINI_API_KEY if both are set to avoid warnings
if os.getenv("GOOGLE_API_KEY") and os.getenv("GEMINI_API_KEY"):
    os.environ.pop("GEMINI_API_KEY", None)


# Initialize Opik tracer with configuration
opik_tracer = OpikTracer(
    name="recipe-agent-system",
    tags=["recipe", "demo", "multi-agent"],
    metadata={
        "environment": "development",
        "version": "1.0.0"
    },
    project_name="google-adk-recipes"
)


# Define tools for recipe research
def search_recipe_database(recipe_name: str) -> str:
    """
    Search a recipe database for detailed information.

    Args:
        recipe_name: The name of the recipe to search for

    Returns:
        Information about the recipe
    """
    # Simulated database search - in production, this would query a real database
    return f"Database results for '{recipe_name}': Found multiple variations with preparation times ranging from 30-60 minutes. Popular cooking methods include baking, grilling, and stir-frying."


def get_nutritional_info(ingredients: list[str]) -> str:
    """
    Get nutritional information for a list of ingredients.

    Args:
        ingredients: List of ingredient names

    Returns:
        Nutritional information summary
    """
    # Simulated nutritional lookup - in production, this would use a nutrition API
    return f"Nutritional analysis for {len(ingredients)} ingredients: High in protein and complex carbohydrates. Contains essential vitamins and minerals."


# Create the Recipe Suggester Agent
recipe_suggester = Agent(
    name="RecipeSuggester",
    model="gemini-2.0-flash-exp",
    instruction="""You are a creative recipe suggester agent. Your role is to:
    1. Analyze the provided ingredients
    2. Suggest ONE creative and practical recipe that uses those ingredients
    3. Provide clear, step-by-step cooking instructions
    4. Include estimated preparation and cooking times

    IMPORTANT: Do not ask follow-up questions. Always provide a complete recipe suggestion immediately based on the ingredients given.
    Be creative but practical, and consider common cooking techniques.""",
    output_key="recipe",
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)


# Create the Recipe Research Agent with tools
recipe_researcher = Agent(
    name="RecipeResearcher",
    model="gemini-2.0-flash-exp",
    instruction="""You are a recipe research specialist. Your role is to:
    1. Look at the recipe that was suggested (check the session state for 'recipe')
    2. Research additional context about that specific recipe using the available tools
    3. Provide historical or cultural background
    4. Use get_nutritional_info tool to get nutritional analysis
    5. Suggest variations and substitutions
    6. Offer tips for best results

    IMPORTANT:
    - Do not ask follow-up questions. Always provide complete research and information immediately.
    - Use BOTH available tools (search_recipe_database and get_nutritional_info) to gather comprehensive information
    - Provide your findings directly in a detailed format.""",
    output_key="research",
    tools=[search_recipe_database, get_nutritional_info],
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)


# Create a Sequential Workflow Agent to ensure both agents run
recipe_pipeline = SequentialAgent(
    name="RecipePipeline",
    sub_agents=[recipe_suggester, recipe_researcher],
    description="Executes recipe suggestion followed by research in sequence."
)

# Create the Root Agent (orchestrator) that uses the sequential pipeline
root_agent = Agent(
    name="RecipeMasterAgent",
    model="gemini-2.0-flash-exp",
    instruction="""You are the Recipe Master Agent. Your role is to coordinate recipe creation.

    When a user provides ingredients:
    1. Delegate to the RecipePipeline agent which will automatically run both RecipeSuggester and RecipeResearcher in sequence
    2. The pipeline will provide you with both the recipe (from RecipeSuggester) and research (from RecipeResearcher)
    3. Synthesize the information from both into a comprehensive, well-formatted final response

    Your final response should include:
    - Recipe name and description
    - Complete ingredient list
    - Step-by-step instructions with timing
    - Nutritional information from research
    - Cultural/historical context
    - Tips and variations

    IMPORTANT: Do not ask follow-up questions. Always provide a complete, well-formatted response.""",
    sub_agents=[recipe_pipeline],
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)


def run_agent_sync(user_prompt: str):
    """Synchronous function to run the agent with a user prompt."""

    async def _run():
        # Create runner with root agent
        runner = InMemoryRunner(
            agent=root_agent,
            app_name="recipe-agent-demo"
        )

        # Create session
        user_id = "user_1"
        session = await runner.session_service.create_session(
            app_name="recipe-agent-demo",
            user_id=user_id
        )

        # Create content message
        content = types.Content(
            role='user',
            parts=[types.Part(text=user_prompt)]
        )

        # Run the agent and collect response
        console.print()

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session.id,
            new_message=content
        ):
            # Print event content as it arrives with agent step indicators
            if hasattr(event, 'content') and event.content:
                if hasattr(event, 'author') and event.author:
                    author = event.author

                    # Print the content with rich formatting
                    if hasattr(event.content, 'parts') and event.content.parts:
                        for part in event.content.parts:
                            if hasattr(part, 'text') and part.text:
                                # Determine panel style based on agent
                                if author == "RecipeSuggester":
                                    title = "🍳 Recipe Suggester"
                                    style = "green"
                                elif author == "RecipeResearcher":
                                    title = "🔬 Recipe Researcher"
                                    style = "blue"
                                elif author == "RecipeMasterAgent":
                                    title = "📖 Final Recipe"
                                    style = "bold magenta"
                                else:
                                    title = author
                                    style = "white"

                                # Display as a panel
                                console.print(Panel(
                                    Markdown(part.text),
                                    title=title,
                                    border_style=style,
                                    padding=(1, 2)
                                ))

    # Run the async function in a new event loop
    asyncio.run(_run())


def main():
    """Main function to run the recipe agent demo."""
    console.print(Panel.fit(
        "[bold cyan]Recipe Agent Demo[/bold cyan]\n"
        "Powered by Google ADK with Opik Observability",
        border_style="cyan"
    ))
    console.print()

    # Get ingredients from user
    ingredients = console.input("[bold yellow]Enter ingredients (comma-separated):[/bold yellow] ").strip()

    if not ingredients:
        console.print("[red]No ingredients provided. Exiting.[/red]")
        return

    console.print()
    with console.status("[bold green]Preparing your recipe...", spinner="dots"):
        pass

    # Create the user prompt
    user_prompt = f"I have these ingredients: {ingredients}. Please suggest a complete recipe with all details, and include nutritional research and background information about the dish."

    # Run the agent
    try:
        run_agent_sync(user_prompt)

        console.print()
        console.print("[bold green]✅ Done! Check your Opik dashboard for detailed traces.[/bold green]")

    except Exception as e:
        console.print(f"\n[bold red]❌ Error occurred:[/bold red] {str(e)}")
        console.print("[yellow]Please check your configuration and try again.[/yellow]")
        import traceback
        traceback.print_exc()

    finally:
        # Ensure all traces are flushed to Opik
        console.print()
        with console.status("[cyan]Flushing traces to Opik...", spinner="dots"):
            opik_tracer.flush()
        console.print("[green]✓ Traces sent successfully![/green]")


if __name__ == "__main__":
    main()