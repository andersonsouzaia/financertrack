import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface PanicButtonProps {
    onRegisterEmergency: (amount: number, category: string, description: string) => Promise<void>;
}

export function PanicButton({ onRegisterEmergency }: PanicButtonProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !category) return;

        setIsSubmitting(true);
        try {
            await onRegisterEmergency(Number(amount), category, description);
            setOpen(false);
            setAmount("");
            setCategory("");
            setDescription("");
        } catch (error) {
            console.error("Error registering emergency:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Registrar Emergência
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Usar Reserva de Emergência
                    </DialogTitle>
                    <DialogDescription>
                        Não se sinta culpado. A reserva existe exatamente para isso.
                        Registre o uso para mantermos o controle.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Valor
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Motivo
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Saúde">Saúde</SelectItem>
                                <SelectItem value="Carro">Conserto de Carro</SelectItem>
                                <SelectItem value="Casa">Manutenção da Casa</SelectItem>
                                <SelectItem value="Desemprego">Desemprego</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Detalhes
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                            placeholder="Ex: Remédios, Mecânico..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Registrando..." : "Confirmar Retirada"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
