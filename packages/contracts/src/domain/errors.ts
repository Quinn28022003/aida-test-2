export type DomainErrorDetails = Record<string, string>;

type DomainErrorConfig<TArgs extends unknown[]> = {
    name: string;
    create: (...args: TArgs) => {
        message: string;
        details?: DomainErrorDetails;
    };
};

export function createDomainErrorClass<TArgs extends unknown[]>({
    name,
    create,
}: DomainErrorConfig<TArgs>): new (...args: TArgs) => Error & DomainErrorDetails {
    return class DomainError extends Error {
        constructor(...args: TArgs) {
            const { message, details = {} } = create(...args);
            super(message);
            this.name = name;
            Object.assign(this, details);
        }
    } as unknown as new (...args: TArgs) => Error & DomainErrorDetails;
}
