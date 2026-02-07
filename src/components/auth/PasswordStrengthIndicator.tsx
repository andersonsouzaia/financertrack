
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { PasswordStrength, getStrengthColor, getStrengthLabel } from '@/lib/passwordValidation';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    strength: PasswordStrength;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ strength }) => {
    const progressValue = (strength.score / 5) * 100;

    const RequirementItem = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => (
        <div className={`flex items-center text-xs ${fulfilled ? 'text-green-500' : 'text-gray-400'}`}>
            {fulfilled ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
            {text}
        </div>
    );

    return (
        <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Força da senha</span>
                <span className={`text-xs font-medium ${getStrengthColor(strength.score).replace('bg-', 'text-')}`}>
                    {getStrengthLabel(strength.score)}
                </span>
            </div>
            <Progress value={progressValue} className={`h-1 ${getStrengthColor(strength.score)}`} />

            <div className="grid grid-cols-2 gap-1 mt-2">
                <RequirementItem fulfilled={strength.hasMinLength} text="Mínimo 8 caracteres" />
                <RequirementItem fulfilled={strength.hasUppercase} text="Letra maiúscula" />
                <RequirementItem fulfilled={strength.hasLowercase} text="Letra minúscula" />
                <RequirementItem fulfilled={strength.hasNumber} text="Número" />
                <RequirementItem fulfilled={strength.hasSpecialChar} text="Caractere especial" />
            </div>
        </div>
    );
};
