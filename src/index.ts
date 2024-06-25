import type { SendEmailOptions, EmailAdapter } from "payload";
import { APIError } from "payload";
import type {
  EmailAddress,
  EmailAttachment,
  EmailClientOptions,
  EmailMessage,
} from "@azure/communication-email";

import { EmailClient } from "@azure/communication-email";

import type { KeyCredential, TokenCredential } from "@azure/core-auth";

export type AzureEmailAdapterArgs = {
  // authenticating using connection string
  connectionString?: string;

  // authenticating using endpoint+credential
  endpoint?: string;
  credential?: KeyCredential | TokenCredential;

  options?: EmailClientOptions;
  defaultFromAddress: string;
};

interface AzureEmailError {
  message: string;
  name: string;
  statusCode: number;
}

type AzureEmailResponse = { id: string } | AzureEmailError;

type AzureEmailAdapter = EmailAdapter<AzureEmailResponse>;

/**
 * Email adapter for [Azure Email Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview)
 */
export function azureEmailAdapter(
  props: AzureEmailAdapterArgs,
): AzureEmailAdapter {
  const {
    connectionString,
    options,
    credential,
    endpoint,
    defaultFromAddress,
  } = props;

  let emailClient: EmailClient;

  if (credential) {
    if (!endpoint) {
      throw new APIError(
        "The `endpoint` option must be set when using a credential",
        400,
      );
    }

    emailClient = new EmailClient(endpoint, credential, options);
  } else {
    if (!connectionString) {
      throw new APIError(
        "The `connectionString` option must be set when not using a credential",
        400,
      );
    }

    emailClient = new EmailClient(connectionString, options);
  }

  const adapter: AzureEmailAdapter = () => ({
    name: "azure-email",
    defaultFromAddress,
    defaultFromName: "doesntmatter@example.com",
    sendEmail: async (message) => {
      const poller = await emailClient.beginSend(
        mapPayloadEmailToAzureEmail(message, defaultFromAddress),
      );

      // return a promise so that we don't poll unless the Promise is used
      return new Promise((resolve, reject) => {
        void poller.pollUntilDone().then((result) => {
          const error = result.error;
          if (error) {
            reject(
              new APIError(error.message ?? "Email not sent", 500, {
                details: error.details,
                additionalInfo: error.additionalInfo,
                code: error.code,
              }),
            );
          } else {
            resolve({ id: result.id });
          }
        });
      });
    },
  });

  return adapter;
}

function mapPayloadEmailToAzureEmail(
  message: SendEmailOptions,
  defaultFromAddress: string,
): EmailMessage {
  return {
    // Required
    senderAddress: defaultFromAddress,
    content: {
      subject: message.subject ?? "",
      html: message.html?.toString() || "",
      plainText: message.text?.toString() || "",
    },
    recipients: {
      to: mapAddresses(message.to),
      cc: mapAddresses(message.cc),
      bcc: mapAddresses(message.bcc),
    },
    attachments: mapAttachments(message.attachments),
  };
}

function mapAddresses(addresses: SendEmailOptions["to"]): EmailAddress[] {
  if (!addresses) return [];

  const addressesArray = Array.isArray(addresses) ? addresses : [addresses];

  return addressesArray.map((address) => {
    if (typeof address === "string") {
      return {
        address,
      };
    } else {
      return {
        address: address.address,
        displayName: address.name,
      };
    }
  });
}

function mapAttachments(
  attachments: SendEmailOptions["attachments"],
): EmailAttachment[] {
  if (!attachments) return [];

  return attachments.map((attachment) => {
    if (!attachment.filename || !attachment.content) {
      throw new APIError("Attachment is missing filename or content", 400);
    }

    if (typeof attachment.content === "string") {
      return {
        contentInBase64: Buffer.from(attachment.content).toString("base64"),
        contentType: attachment.contentType ?? "application/octet-stream",
        name: attachment.filename,
      };
    }

    if (attachment.content instanceof Buffer) {
      return {
        contentInBase64: attachment.content.toString("base64"),
        contentType: attachment.contentType ?? "application/octet-stream",
        name: attachment.filename,
      };
    }

    throw new APIError("Attachment content must be a string or a buffer", 400);
  });
}
