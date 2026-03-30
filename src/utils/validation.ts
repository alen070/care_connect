/**
 * ============================================
 * VALIDATION UTILITIES
 * ============================================
 * Helpers for email and password validation.
 */

export interface PasswordCriterion {
    id: string;
    label: string;
    met: boolean;
}

/**
 * Validates an email stricter than standard HTML5 by checking if the local part
 * (before the @) consists only of numbers.
 * @param email 
 * @returns An error message string if invalid, otherwise null.
 */
export function validateEmail(email: string): string | null {
    if (!email) return 'Email is required';

    if (!email.includes('@')) {
        return 'Email must contain an "@" symbol';
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email format (e.g. name@example.com)';
    }

    // Check if local part is purely numeric (e.g., 123@gmail.com)
    const [localPart] = email.split('@');
    if (/^\d+$/.test(localPart)) {
        return 'Email address cannot consist only of numbers before the @';
    }

    return null;
}

/**
 * Validates that a phone number is exactly 10 digits.
 * @param phone 
 * @returns An error message string if invalid, otherwise null.
 */
export function validatePhone(phone: string): string | null {
    if (!phone) return 'Phone number is required';
    
    // Remove any non-numeric characters for checking
    const numbersOnly = phone.replace(/\D/g, '');
    
    if (numbersOnly.length < 10) {
        return `Phone number is too short (${numbersOnly.length}/10 digits). Please enter exactly 10 digits.`;
    }
    
    if (numbersOnly.length > 10) {
        return `Phone number is too long (${numbersOnly.length}/10 digits). Please enter exactly 10 digits.`;
    }

    if (!/^\d{10}$/.test(numbersOnly)) {
        return 'Phone number must contain only numbers';
    }

    return null;
}

/**
 * Validates a password against a standard set of security criteria.
 * @param password 
 * @returns Array of PasswordCriterion objects indicating which rules are met.
 */
export function checkPasswordStrength(password: string): PasswordCriterion[] {
    return [
        {
            id: 'length',
            label: 'At least 8 characters long',
            met: password.length >= 8,
        },
        {
            id: 'uppercase',
            label: 'Contains uppercase letter',
            met: /[A-Z]/.test(password),
        },
        {
            id: 'lowercase',
            label: 'Contains lowercase letter',
            met: /[a-z]/.test(password),
        },
        {
            id: 'number',
            label: 'Contains a number',
            met: /[0-9]/.test(password),
        },
        {
            id: 'special',
            label: 'Contains special character (!@#$%^&*)',
            met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        },
    ];
}

/**
 * Type guard for role-based access.
 * Moved here from AuthContext.tsx to avoid Fast Refresh issues.
 */
export function hasRole(user: { role: string } | null, role: string): boolean {
    return user?.role === role;
}
