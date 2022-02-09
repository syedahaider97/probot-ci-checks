# probot-ci-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) that creates custom Github Checks

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t probot-ci-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> probot-ci-bot
```

## License

[ISC](LICENSE) © 2022 Ali Haider <ali.haider@ibm.com>
