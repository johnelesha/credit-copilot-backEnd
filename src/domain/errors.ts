export class DomainError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class InvalidApplication extends DomainError {
    constructor(message: string) {
        super(message, "INVALID_APPLICATION", 400);
    }
}

export class UnverifiedExtraction extends DomainError {
    constructor(message: string) {
        super(message, "UNVERIFIED_EXTRACTION", 422);
    }
}

export class PolicyEditionNotFound extends DomainError {
    constructor(message: string) {
        super(message, "POLICY_EDITION_NOT_FOUND", 404);
    }
}

export class AuthorityLimitExceeded extends DomainError {
    constructor(message: string) {
        super(message, "AUTHORITY_LIMIT_EXCEEDED", 403);
    }
}

export class InvalidLLMOutput extends DomainError {
    constructor(message: string) {
        super(message, "INVALID_LLM_OUTPUT", 422);
    }
}
