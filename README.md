# xx-bridge

## Description

`xx-bridge` is a lightweight application designed to convert `xx` tokens into their wrapped equivalents. It provides an intuitive standalone interface for users to seamlessly interact with the conversion process.

## Table of Contents

- [xx-bridge](#xx-bridge)
  - [Description](#description)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Scripts](#scripts)
  - [Dependencies](#dependencies)
  - [Development](#development)
    - [Project Structure](#project-structure)
    - [Environment Variables](#environment-variables)
    - [Pre-commit Hooks](#pre-commit-hooks)
    - [Blockchain Details](#blockchain-details)
    - [Build Process](#build-process)
  - [Contributing](#contributing)
    - [Guidelines](#guidelines)
  - [License](#license)
  - [Contact](#contact)

## Installation

To get started with `xx-bridge`, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/xx-bridge.git
   ```

2. Navigate to the project directory:

   ```bash
   cd xx-bridge
   ```

3. Install the necessary dependencies:
   ```bash
   npm install
   ```

## Usage

To start the application in development mode, use:

```bash
npm run dev
```

The development server will run on port `9296`. Open your browser and navigate to `http://localhost:9296` to access the application.

## Scripts

The following scripts are available in the `package.json` file for development and production tasks:

- `dev`: Launches the development server.
- `build`: Compiles TypeScript and builds the project using Vite.
- `lint`: Checks the code for quality issues using ESLint.
- `lint:fix`: Automatically fixes ESLint errors.
- `prettier:check`: Verifies code formatting with Prettier.
- `prettier:fix`: Formats the code using Prettier.
- `qa:check`: Runs a complete quality assurance suite, including TypeScript checks, ESLint, and Prettier.

## Dependencies

Key dependencies used in this project include:

- **React** and **React-DOM**: For building the user interface.
- **Vite**: Provides fast development and build processes.
- **Apollo Client**: Manages GraphQL data.
- **Redux Toolkit**: Handles application state.
- **Wagmi** and **Web3Modal**: Simplifies blockchain interactions.

For a comprehensive list, refer to the `package.json` file.

## Development

The project is configured with tools and standards to ensure smooth collaboration and efficient development.

The project is configured to use TypeScript, with settings defined in `tsconfig.json`. It also uses ESLint and Prettier for code quality and formatting.

### Project Structure

```plaintext
src/
├── @types/           # TypeScript definitions and type augmentations.
├── assets/           # Static assets like images, logos, and icons, organized by category.
├── components/       # Modular and reusable UI components (e.g., Navbar, Footer, Modals).
├── consts.ts         # Application-wide constants.
├── contracts/        # Blockchain smart contract interfaces and utilities for interactions.
├── hooks/            # Custom React hooks for shared logic (e.g., storage, wallet, and utilities).
├── pages/            # Page components representing application routes (e.g., Bridge, ConnectPage).
├── plugins/          # Configuration and setup for external libraries (e.g., Apollo, Redux, Substrate).
├── utils/            # General-purpose utility functions (e.g., deepFreeze, promise handling).
├── App.tsx           # Root React component.
├── AppRouter.tsx     # Application routing logic.
├── theme.ts          # Configuration for the Material-UI theme or other UI frameworks.
├── main.tsx          # Entry point for the React application.
```

### Environment Variables

Defined in the `netlify.toml` file and organized by context (e.g., branch-specific settings).

Environment variables are also listed in the `.env-example` file. Copy and paste them into a `.env` file, adjusting the values according to the desired context.

### Pre-commit Hooks

The project uses Husky to enforce code quality:

- **ESLint**: Ensures code quality.
- **Prettier**: Maintains consistent code formatting.

These hooks run automatically before committing.

### Blockchain Details

- **Supported Chains**:
  - Ethereum (Mainnet, Testnets)
  - xx Network (Mainnet, Testnets)
- **Smart Contracts**: Smart contract addresses for development are documented in `src/contracts/`.

### Build Process

The project uses Vite for builds:

```bash
npm run build
```

Build artifacts are output to the `dist/` folder.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. **Fork the repository**.
2. **Create a new branch** for your feature or bugfix (e.g., `feature/add-new-feature` or `bugfix/fix-issue`).
3. **Commit your changes** with descriptive messages.
4. **Push your branch** to your fork.
5. **Submit a pull request (PR)** with the following structure:
   - **Changes**: Summary of changes made.
   - **Reason**: Explanation of why these changes are necessary.
   - **Tag**: Choose from the following:
     - `bug`: Fixes a bug.
     - `feature`: Adds new functionality.
     - `improvement`: Enhances existing functionality.
     - `docs`: Documentation updates.
     - `test`: Adds or modifies tests.
     - `refactor`: Code restructuring without functional changes.
     - `chore`: Minor maintenance tasks.
     - `style`: Formatting changes with no code logic alterations.
     - `performance`: Performance optimizations.

### Guidelines

- Follow the repository's coding style.
- Write clear commit messages (e.g., "Fix: Resolved token conversion issue").
- Include relevant tests for your changes.
- Ensure no existing functionality is broken by your contributions.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact

If you have questions, need support, or wish to discuss features, contact:  
📧 [devops@xx.network]
