#!/usr/bin/env python3

import json
import logging
import pathlib
import subprocess
import sys
import time

import click
import frida
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

logger = logging.getLogger(__name__)


class FridaAgent:
    def __init__(
        self,
        agent_file: str,
        package_name: str,
        output_folder: str,
        watch=False,
    ):
        self.agent_file = agent_file
        self.package_name = package_name
        self.output_folder = output_folder

        self.log_file = (
            pathlib.Path(output_folder)
            / f"{int(time.time())}_{package_name.replace('.', '-')}.log"
        )
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

        # Load script
        self._load_script(agent_file)

        # Watch changes
        self.observer = None
        if watch:
            event_handler = FileSystemEventHandler()
            event_handler.on_modified = lambda event: (
                print(f"Script modified: {event.src_path} - Reloading...", file=sys.stderr),
                self.reload()
            ) if not event.is_directory else None
            self.observer = Observer()
            self.observer.schedule(event_handler, agent_file, recursive=True)
            self.observer.start()

        self.device = frida.get_usb_device()

    def _on_message(self, message, data):
        if message["type"] == "send":
            self._process(message["payload"])

    def _process(self, payload):
        event = payload["event"]
        data = payload["data"]

        output = {"time": int(time.time() * 1000), "event": event, "data": data}
        self.append_to_file(output)

    def append_to_file(self, x):
        with open(self.log_file, "a") as f:
            f.write(json.dumps(x, separators=(",", ":")))
            f.write("\n")

    def _load_script(self, agent_file):
        with open(agent_file, "r") as f:
            self.script_data = f.read()

    def start(self):
        self.pid = self.device.spawn(self.package_name)
        self.session = self.device.attach(self.pid)

        self.script = self.session.create_script(self.script_data)
        self.script.on("message", self._on_message)
        self.script.load()
        self.device.resume(self.pid)

    def reload(self):
        self.script.unload()

        self._load_script(self.agent_file)
        self.script = self.session.create_script(self.script_data)
        self.script.on("message", self._on_message)
        self.script.load()

    def stop(self):
        try:
            self.device.kill(self.pid)
        except frida.ProcessNotFoundError:
            logger.error("Process already dead")

        if self.observer is not None:
            self.observer.stop()
            self.observer.join()


def adb_shell(command: str, root=False, cwd=None):
    commands = ["adb", "shell"]
    if root:
        commands.append("su 0 'sh' -c \"" + command + '"')
    else:
        commands.append(command)

    p = subprocess.Popen(commands, cwd=cwd)
    p.communicate()
    return p.returncode


@click.group()
def cli():
    pass


@cli.command()
@click.argument(
    "package-name",
    type=str,
)
@click.option(
    "agent_script",
    "-f",
    "--file",
    type=str,
    help="Path to the agent script",
    default="_agent.js",
)
@click.option(
    "--log-folder",
    type=str,
    help="Folder to store logs",
    default="logs",
)
@click.option(
    "-w",
    "--watch",
    is_flag=True,
    help="Watch for changes of the agent script",
)
def run(
    package_name: str,
    agent_script: str,
    log_folder: str,
    watch: bool,
):
    # Check if file exists
    if not pathlib.Path(agent_script).exists():
        logger.error(f"File {agent_script} does not exist")
        sys.exit(1)

    agent = FridaAgent(agent_script, package_name, log_folder, watch)
    agent.start()

    # Keep terminal open
    logger.info("CTRL-D to kill...")
    sys.stdin.read()

    agent.stop()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
    cli()
