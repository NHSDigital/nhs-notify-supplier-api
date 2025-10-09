---
title: API Developers - Getting Started
order: 0
nav_order: 4
has_children: false
has_toc: false
---

Developers for the NHS Notify Supplier API should understand the following:

## Repository Contents

The Supplier API repository contains the following:

- [.devcontainer](/.devcontainer) - A devcontainer that should be used for work on this repository that maintains developer dependencies
- [.github](/.github) - GitHub workflows and actions for CI/CD
- [docs](/docs) - This documentation; generated and publish on pre-release (PR merge to main)
- [infrastructure](/infrastructure) - Infrastructure as code maintained in Terraform
- [internal](/internal) - Internal packacges and libraries, e.g. database repositories
- [lambdas](/lambdas) - Implementation of lambda handler functions
- [postman](/postman) - Postman collection(s) which can be imported to assist in API development and testing
- [sandbox](/sandbox) - Sandbox logic; [!NOTE] The sandbox specification is built from the core specification and should not be directly modified
- [scripts](/scripts) - Helpful tools for maintaining the project; e.g. includes implementation for commit hook checks and test data generation
- [server](/server) - Generated server implementation for the API; [!NOTE] Implementation is incomplete and these should not be used
- [specification](/specification) - The location and build fragments for the API's OAS file
- [src](/src) - Non lambda implementation
- [tests](/tests) - Higher level component and E2E test suites

The API dependencies are manages through [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces/)

## Setup

Clone the repository

```shell
git clone https://github.com/NHSDigital/nhs-notify-supplier-api.git
cd nhs-notify-supplier-api
code .
```

### Prerequisites & Configuration

#### devcontainer

You should use the devcontainer for thsi repository to satisy pre-requisites and configuration.
You can open this using devcontainer plugins or GitHub workspaces
By default it will run the necessary `make config`, `postcreatecommand.sh`, and `poststartcommand.sh`

#### Pre-requisites

The following software packages, or their equivalents, are expected to be installed and configured:

- [Docker](https://www.docker.com/) container runtime or a compatible tool, e.g. [Podman](https://podman.io/),
- [asdf](https://asdf-vm.com/) version manager,
- [GNU make](https://www.gnu.org/software/make/) 3.82 or later,
- [GNU coreutils](https://www.gnu.org/software/coreutils/) and [GNU binutils](https://www.gnu.org/software/binutils/) may be required to build dependencies like Python, which may need to be compiled during installation. For macOS users, this has been scripted and automated by the `dotfiles` project; please see this [script](https://github.com/nhs-england-tools/dotfiles/blob/main/assets/20-install-base-packages.macos.sh) for details,
- [Python](https://www.python.org/) required to run Git hooks,
- [Ruby](https://www.ruby-lang.org/en/) required for documentation builds,
- [`jq`](https://jqlang.github.io/jq/) a lightweight and flexible command-line JSON processor.

> [!NOTE]<br>
> The version of GNU make available by default on macOS is earlier than 3.82. You will need to upgrade it or certain `make` tasks will fail. On macOS, you will need [Homebrew](https://brew.sh/) installed, then to install `make`, like so:
>
> ```shell
> brew install make
> ```
>
> You will then see instructions to fix your `$PATH` variable to make the newly installed version available. If you are using [dotfiles](https://github.com/nhs-england-tools/dotfiles), this is all done for you.

#### Configuration

Installation and configuration of the toolchain dependencies (including pre-git hooks).

```shell
make config
```

### Contributing

Refer to [CONTRIBUTING](/CONTRIBUTING.md) for details about contributions to this repository
