# Managing Node.js Versions

This guide explains how to manage Node.js versions using Node Version Manager (nvm), which allows you to easily switch between different Node.js versions for different projects.

## Installing Node Version Manager (nvm)

### On macOS and Linux

1. Install nvm using curl:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Or using wget:

```bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

2. Add the following to your shell profile (~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.bashrc):

```bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

3. Restart your terminal or run `source ~/.bashrc` (or your appropriate shell profile file).

### On Windows

For Windows, you can use [nvm-windows](https://github.com/coreybutler/nvm-windows):

1. Download the installer from the [releases page](https://github.com/coreybutler/nvm-windows/releases).
2. Run the installer and follow the instructions.

## Using nvm to Manage Node.js Versions

### Installing Node.js Versions

1. Install the latest LTS version of Node.js:

```bash
nvm install --lts
```

2. Install a specific version of Node.js:

```bash
nvm install 20.10.0  # Replace with your desired version
```

### Setting a Default Node.js Version

To set a default Node.js version that will be used in any new shell:

```bash
nvm alias default 20.10.0  # Replace with your desired version
```

### Switching Between Node.js Versions

1. Use a specific version in the current shell:

```bash
nvm use 20.10.0  # Replace with your desired version
```

2. Use the latest LTS version:

```bash
nvm use --lts
```

### Project-Specific Node.js Versions

You can create a `.nvmrc` file in your project root to specify the Node.js version for that project:

1. Create a `.nvmrc` file:

```bash
echo "20.10.0" > .nvmrc  # Replace with your desired version
```

2. Then, when you're in that project directory, simply run:

```bash
nvm use
```

This will automatically use the version specified in the `.nvmrc` file.

## For Next.js Projects

Next.js requires Node.js version "^18.18.0 || ^19.8.0 || >= 20.0.0". To ensure you're using a compatible version:

1. Install a compatible version:

```bash
nvm install 20.10.0  # Latest LTS as of writing
```

2. Use it for your project:

```bash
cd your-nextjs-project
nvm use 20.10.0
```

3. Create an `.nvmrc` file in your project:

```bash
echo "20.10.0" > .nvmrc
```

## Updating Node.js

To update to the latest version of a specific Node.js release:

```bash
nvm install 20  # This will install the latest version of Node.js 20.x
```

To update to the latest LTS version:

```bash
nvm install --lts
```

## Checking Installed Versions

To see all installed Node.js versions:

```bash
nvm ls
```

To see available versions to install:

```bash
nvm ls-remote
```

## Uninstalling Node.js Versions

To uninstall a specific version:

```bash
nvm uninstall 18.17.0  # Replace with the version you want to uninstall
```

## Troubleshooting

If you encounter issues with nvm:

1. Make sure nvm is properly installed:

```bash
command -v nvm
```

2. If nvm command is not found, check if the nvm initialization script is in your shell profile.

3. Try restarting your terminal or running:

```bash
source ~/.nvm/nvm.sh
```

## Additional Resources

- [nvm GitHub Repository](https://github.com/nvm-sh/nvm)
- [nvm-windows GitHub Repository](https://github.com/coreybutler/nvm-windows)
- [Node.js Official Website](https://nodejs.org/)