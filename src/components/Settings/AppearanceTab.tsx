import { useTheme } from "next-themes"; // Assuming next-themes is used or similar context
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

// Mocking useTheme slightly if not fully available, but typical pattern below
// If useTheme hook not present, we can implement manual class switching for now.

export function AppearanceTab() {
    const [theme, setTheme] = useState("system");

    // Effect to sync with document class (simple version if next-themes not configured globally)
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    // Try to load saved preference
    useEffect(() => {
        // Ideally load from user_settings or local storage
        // For now simple local state
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Aparência</h3>
                <p className="text-sm text-muted-foreground">
                    Personalize como o Financertrack se parece no seu dispositivo.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tema</CardTitle>
                    <CardDescription>
                        Selecione o tema de sua preferência.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        defaultValue={theme}
                        value={theme}
                        onValueChange={setTheme}
                        className="grid max-w-md grid-cols-3 gap-8 pt-2"
                    >
                        <div className="text-center space-y-2">
                            <Label htmlFor="light" className="flex flex-col items-center gap-2 cursor-pointer [&:has([data-state=checked])>div]:border-primary">
                                <div className="rounded-md border-2 border-muted p-1 hover:border-accent items-center justify-center flex aspect-square w-full max-w-[100px] bg-white text-slate-950 shadow-sm">
                                    <Sun className="h-10 w-10" />
                                </div>
                                <span className="text-sm font-medium">Claro</span>
                            </Label>
                            <RadioGroupItem value="light" id="light" className="sr-only" />
                        </div>

                        <div className="text-center space-y-2">
                            <Label htmlFor="dark" className="flex flex-col items-center gap-2 cursor-pointer [&:has([data-state=checked])>div]:border-primary">
                                <div className="rounded-md border-2 border-muted p-1 hover:border-accent items-center justify-center flex aspect-square w-full max-w-[100px] bg-slate-950 text-white shadow-sm">
                                    <Moon className="h-10 w-10" />
                                </div>
                                <span className="text-sm font-medium">Escuro</span>
                            </Label>
                            <RadioGroupItem value="dark" id="dark" className="sr-only" />
                        </div>

                        <div className="text-center space-y-2">
                            <Label htmlFor="system" className="flex flex-col items-center gap-2 cursor-pointer [&:has([data-state=checked])>div]:border-primary">
                                <div className="rounded-md border-2 border-muted p-1 hover:border-accent items-center justify-center flex aspect-square w-full max-w-[100px] bg-slate-100 dark:bg-slate-800 text-foreground shadow-sm">
                                    <Monitor className="h-10 w-10" />
                                </div>
                                <span className="text-sm font-medium">Sistema</span>
                            </Label>
                            <RadioGroupItem value="system" id="system" className="sr-only" />
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>
        </div>
    );
}
