import { Check, X } from 'lucide-react';
import { checkPasswordStrength } from '@/utils/validation';

export function PasswordStrengthIndicator({ password }: { password: string }) {
    const criteria = checkPasswordStrength(password);

    // If password is empty, don't show the colored text, just neutral gray.
    const isStarted = password.length > 0;

    return (
        <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-gray-500 mb-2">Password must contain:</p>
            {criteria.map((criterion) => (
                <div key={criterion.id} className="flex items-center gap-2">
                    {criterion.met ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                        <X className={`w-3.5 h-3.5 ${isStarted ? 'text-red-400' : 'text-gray-300'}`} />
                    )}
                    <span className={`text-xs ${criterion.met ? 'text-green-600' : isStarted ? 'text-red-500' : 'text-gray-500'}`}>
                        {criterion.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
