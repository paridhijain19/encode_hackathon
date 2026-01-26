"""
Amble Companion Agent - Local Runner
====================================

Running the Amble Agent locally with:
- Google ADK (Agent Development Kit)
- Opik Observability (Tracing)
- Rich Terminal UI

Usage:
    python -m agent.opik_agent
"""

import asyncio
import os
import sys
import warnings
from dotenv import load_dotenv

# Rich UI Imports
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.prompt import Prompt
from rich.table import Table
from rich import box

# ADK Imports
from google.adk.runners import InMemoryRunner
from google.genai import types

# Add the project root to sys.path to ensure absolute imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.append(project_root)

# Import the agent and tracer from our definition
try:
    from agent.agent import root_agent, opik_tracer
except ImportError as e:
    print(f"Error importing agent: {e}")
    print("Make sure you are running this from the project root or the 'agent' package is accessible.")
    sys.exit(1)

# Configuration
warnings.filterwarnings('ignore')
load_dotenv()

# Initialize Console
console = Console()

def get_agent_style(author: str) -> tuple[str, str]:
    """Returns (title, style_color) for a given agent name."""
    styles = {
        "amble_text": ("🤖 Amble", "bold magenta"),
        "mood_agent": ("💙 Mood", "blue"),
        "activity_agent": ("🏃 Activity", "green"),
        "expense_agent": ("💰 Expense", "red"),
        "appointment_agent": ("📅 Calendar", "yellow"),
        "wellness_agent": ("🏥 Wellness", "cyan"),
        "local_events_agent": ("🎉 Events", "orange1"),
        "user": ("👤 You", "white"),
        "model": ("🧠 Thinking", "dim white"),
    }
    return styles.get(author, (author, "white"))

async def run_chat_session():
    """Runs an interactive chat session with the agent."""
    
    # Header
    console.print(Panel.fit(
        "[bold cyan]Amble Companion Agent[/bold cyan]\n"
        "Local Interactive Mode\n"
        "[dim]Type 'quit', 'exit', or 'bye' to stop.[/dim]",
        border_style="cyan",
        box=box.ROUNDED
    ))
    console.print()

    # Initialize Runner
    runner = InMemoryRunner(
        agent=root_agent,
        app_name="amble-local"
    )

    # Create Session
    user_id = "local_user"
    try:
        session = await runner.session_service.create_session(
            app_name="amble-local",
            user_id=user_id
        )
        console.print(f"[dim]Session created: {session.id}[/dim]")
    except Exception as e:
        console.print(f"[bold red]Failed to create session:[/bold red] {e}")
        return

    # Chat Loop
    while True:
        try:
            # 1. Get User Input
            console.print()
            user_input = Prompt.ask("[bold green]You[/bold green]")
            
            if user_input.lower() in ('quit', 'exit', 'bye'):
                console.print("[yellow]Goodbye! 👋[/yellow]")
                break
                
            if not user_input.strip():
                continue

            # 2. Add 'Thinking' indicator
            with console.status("[bold magenta]Amble is thinking...[/bold magenta]", spinner="dots"):
                
                # 3. Create Message
                content = types.Content(
                    role='user',
                    parts=[types.Part(text=user_input)]
                )

                # 4. Stream Response
                console.print() # Newline before response
                
                # We collect the final response to print neatly if needed, 
                # but we'll try to stream events as they come.
                
                async for event in runner.run_async(
                    user_id=user_id,
                    session_id=session.id,
                    new_message=content
                ):
                    # Check for content events
                    if hasattr(event, 'content') and event.content:
                        author = getattr(event, 'author', 'Amble')
                        
                        # Skip empty content
                        if not event.content.parts:
                            continue
                            
                        text_content = ""
                        for part in event.content.parts:
                            if hasattr(part, 'text') and part.text:
                                text_content += part.text
                        
                        if not text_content:
                            continue

                        # Determine style
                        title, style = get_agent_style(author)
                        
                        # Print generic sub-agent thoughts/actions in panels
                        console.print(Panel(
                            Markdown(text_content),
                            title=title,
                            border_style=style,
                            padding=(0, 2),
                            width=100  # constrain width for readability
                        ))

        except KeyboardInterrupt:
            console.print("\n[yellow]Interrupted by user. Exiting...[/yellow]")
            break
        except Exception as e:
            console.print(f"\n[bold red]Error in chat loop:[/bold red] {e}")
            import traceback
            traceback.print_exc()

    # Cleanup
    console.print()
    with console.status("[cyan]Flushing Opik traces...[/cyan]", spinner="dots"):
        try:
            opik_tracer.flush()
            console.print("[green]✓ Traces saved.[/green]")
        except Exception as e:
            console.print(f"[red]Error flushing traces: {e}[/red]")

def main():
    try:
        asyncio.run(run_chat_session())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        console.print(f"[bold red]Fatal Error:[/bold red] {e}")

if __name__ == "__main__":
    main()
