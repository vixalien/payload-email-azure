# Azure Email Communication Services Adapter

This adapter allows you to send emails using
[Azure Email Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview)

## Installation

```sh
pnpm add @rwarri/payload-email-azure
```

## Prerequesites

1. [An Azure account with an active subscription](https://azure.microsoft.com/free/).
2. [An Azure Email Communication Services resource created and ready with a provisioned domain](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/create-email-communication-resource).
3. [An active Azure Communication Services resource connected to an Email Domain and its connection string. Get started by connecting an Email Communication Resource with a Azure Communication Resource](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource)

```ts
import { azureEmailAdapter } from "@org/payload-email-azure";

export default buildConfig({
  email: azureEmailAdapter({
    defaultFromAddress: "DoNotReply@notify.example.com",
    connectionString: process.env.AZURE_EMAIL_CONNECTION_STRING,
  }),
});
```

> Note: The `defaultFromAddress` must match one of the pre-configured
> `EmailFrom` addresses in your Azure Communication Service resource.

## Authentication

There are a few different options available for authenticating an email client
with Azure.

### Using Connection String

```ts
import { azureEmailAdapter } from "@org/payload-email-azure";

export default buildConfig({
  email: azureEmailAdapter({
    defaultFromAddress: "noreply@notify.example.com",
    connectionString: process.env.AZURE_EMAIL_CONNECTION_STRING,
  }),
});
```

### Using Microsoft Entra ID

You may also choose to authenticate with Microsoft Entra ID using the
`@azure/identity` package.

```ts
import { azureEmailAdapter } from "@org/payload-email-azure";
import { DefaultAzureCredential } from "@azure/identity";

export default buildConfig({
  email: azureEmailAdapter({
    defaultFromAddress: "noreply@notify.example.com",
    endpoint: process.env.AZURE_EMAIL_ENDPOINT,
    // The DefaultAzureCredential uses the following environment variables:
    // AZURE_CLIENT_SECRET, AZURE_CLIENT_ID and AZURE_TENANT_ID
    credential: new DefaultAzureCredential(),
  }),
});
```

### Using Azure Key Credentials

You can also choose to authenticate the email client using an
AzureKeyCredential. Both the `key` and the `endpoint` can be founded on the
"Keys" pane under "Settings" in your Communication Services Resource.

```ts
import { azureEmailAdapter } from "@org/payload-email-azure";
import { AzureKeyCredential } from "@azure/core-auth";

export default buildConfig({
  email: azureEmailAdapter({
    defaultFromAddress: "noreply@notify.example.com",
    endpoint: process.env.AZURE_EMAIL_ENDPOINT,
    credential: new AzureKeyCredential(process.env.AZURE_EMAIL_KEY),
  }),
});
```
