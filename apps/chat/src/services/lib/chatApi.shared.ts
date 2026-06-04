import { failureEnvelopeSchema } from '@aida/contracts';

export async function toApiErrorMessage(error: unknown, response: Response, fallbackMessage: string) {
    const body = error ?? (await response.json().catch(() => null));
    const parsed = failureEnvelopeSchema.safeParse(body);

    if (parsed.success) {
        const reason = parsed.data.error.details?.reason;
        if (typeof reason === 'string' && reason.length > 0) {
            return `${parsed.data.error.message}: ${reason}`;
        }

        return parsed.data.error.message;
    }

    return fallbackMessage;
}
