# mdgitwiki

mdgitwiki is a lightweight wiki engine that renders Markdown pages directly from a Git repository (public or private).

## How It Works

* A Git repository is used as the single source of truth for all content.
* Each folder in the repository becomes a navigable section in the menu.
* Each `.md` file in the repository is rendered as a wiki page.
* Navigation is generated automatically based on the repository structure.

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Configure `config.json` with your settings
4. Run: `npm start`

## Configuration

Edit `config.json` with the following options:

* `port`: Server port (default: 3000)
* `username`: Git username for private repositories (leave empty for public repos)
* `password`: Git password/token for private repositories (leave empty for public repos)
* `repoUrl`: Git repository URL to render as wiki
* `updateIntervalMinutes`: Auto-pull interval in minutes (0 to disable)

### Example for Public Repository

```json
{
    "port": 3000,
    "username": "",
    "password": "",
    "repoUrl": "https://github.com/user/public-repo",
    "updateIntervalMinutes": 5
}
```

### Example for Private Repository

```json
{
    "port": 3000,
    "username": "your-username",
    "password": "your-personal-access-token",
    "repoUrl": "https://github.com/user/private-repo",
    "updateIntervalMinutes": 5
}
```

> **Note:** For GitHub private repositories, use a Personal Access Token (PAT) instead of your password.

## Page Metadata

Pages can define metadata at the top of the Markdown file to control how they appear in the menu.

Example:

```md
---
menu_option: Page Name in Menu
---

# Page Title

Page content goes here.
```

### Supported Metadata

* `menu_option`: Defines the display name of the page in the navigation menu.
